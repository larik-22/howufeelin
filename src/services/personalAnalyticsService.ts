/* eslint-disable */
//@ts-nocheck
import {
  Timestamp,
  Unsubscribe,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  collection,
  getDocs,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { ratingService } from './ratingService';
import { groupService } from './groupService';
import {
  MoodInsights,
  MoodTrend,
  MoodPattern,
  TimeOfDayPattern,
  DateRangeFilter,
  TimeRange,
} from '@/types/Analytics';
import { Rating } from '@/types/Rating';

export interface PersonalAnalyticsService {
  // Get mood insights for a user across all groups
  getMoodInsights(userId: string, dateRange: DateRangeFilter): Promise<MoodInsights>;

  // Get mood insights for a specific group
  getGroupMoodInsights(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter
  ): Promise<MoodInsights>;

  // Get mood trends for a user across all groups
  getMoodTrends(userId: string, dateRange: DateRangeFilter): Promise<MoodTrend[]>;

  // Get mood trends for a specific group
  getGroupMoodTrends(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter
  ): Promise<MoodTrend[]>;

  // Get day of week patterns
  getDayOfWeekPatterns(ratings: Rating[]): MoodPattern[];

  // Get time of day patterns
  getTimeOfDayPatterns(ratings: Rating[]): TimeOfDayPattern[];

  // Calculate mood volatility (standard deviation)
  calculateMoodVolatility(ratings: Rating[]): number;

  // Calculate streak days
  calculateStreakDays(ratings: Rating[]): number;

  // Get date range based on time range
  getDateRangeForTimeRange(timeRange: TimeRange): DateRangeFilter;

  // Subscribe to mood insights for a user across all groups
  subscribeToMoodInsights(
    userId: string,
    dateRange: DateRangeFilter,
    callback: (insights: MoodInsights) => void
  ): Unsubscribe;

  // Subscribe to mood insights for a specific group
  subscribeToGroupMoodInsights(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter,
    callback: (insights: MoodInsights) => void
  ): Unsubscribe;

  // Subscribe to mood trends for a user across all groups
  subscribeToMoodTrends(
    userId: string,
    dateRange: DateRangeFilter,
    callback: (trends: MoodTrend[]) => void
  ): Unsubscribe;

  // Subscribe to mood trends for a specific group
  subscribeToGroupMoodTrends(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter,
    callback: (trends: MoodTrend[]) => void
  ): Unsubscribe;

  // Check if a subscription is active
  isSubscriptionActive(type: string, id: string): boolean;

  // Unsubscribe from all active subscriptions
  unsubscribeAll(): void;

  // Cleanup resources and subscriptions
  cleanup(): void;
}

class FirestorePersonalAnalyticsService implements PersonalAnalyticsService {
  private activeSubscriptions: Record<string, Unsubscribe> = {};
  private readonly ANALYTICS_COLLECTION = 'analytics_snapshots';
  private batchUpdateTimeout: NodeJS.Timeout | null = null;
  private pendingUpdates: Set<string> = new Set();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache TTL
  private readonly BATCH_UPDATE_DELAY_MS = 3000; // 3 seconds batch update delay

  private generateSubscriptionId(type: string, id: string): string {
    return `${type}_${id}`;
  }

  private unsubscribe(subscriptionId: string): void {
    if (this.activeSubscriptions[subscriptionId]) {
      console.log(`Unsubscribing from ${subscriptionId}`);
      this.activeSubscriptions[subscriptionId]();
      delete this.activeSubscriptions[subscriptionId];
    }
  }

  public unsubscribeAll(): void {
    const count = Object.keys(this.activeSubscriptions).length;
    if (count > 0) {
      console.log(`Unsubscribing from ${count} active subscriptions`);
      Object.keys(this.activeSubscriptions).forEach(id => {
        this.unsubscribe(id);
      });
    }
  }

  public isSubscriptionActive(type: string, id: string): boolean {
    const subscriptionId = this.generateSubscriptionId(type, id);
    return !!this.activeSubscriptions[subscriptionId];
  }

  private getCacheKey(userId: string, groupId: string | null, dateRange: DateRangeFilter): string {
    // Create a more efficient cache key that's still unique
    return `${userId}_${groupId || 'all'}_${dateRange.startDate}_${dateRange.endDate}`;
  }

  private async getCachedInsights(cacheKey: string): Promise<MoodInsights | null> {
    try {
      const snapshotRef = doc(db, this.ANALYTICS_COLLECTION, cacheKey);
      const snapshot = await getDoc(snapshotRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        // Check if the cache is still valid
        const lastUpdated = data.lastUpdated.toDate();
        const now = new Date();
        const cacheAge = now.getTime() - lastUpdated.getTime();

        if (cacheAge < this.CACHE_TTL_MS) {
          console.log('Returning cached insights');
          // Ensure we have all required fields
          if (data.insights && typeof data.insights === 'object') {
            return {
              overallAverage: data.insights.overallAverage || 0,
              highestMood: data.insights.highestMood || 0,
              lowestMood: data.insights.lowestMood || 0,
              moodVolatility: data.insights.moodVolatility || 0,
              streakDays: data.insights.streakDays || 0,
              totalEntries: data.insights.totalEntries || 0,
              moodTrends: data.insights.moodTrends || [],
              dayOfWeekPatterns: data.insights.dayOfWeekPatterns || [],
              timeOfDayPatterns: data.insights.timeOfDayPatterns || [],
              recentRatings: data.insights.recentRatings || [],
            };
          }
        } else {
          console.log('Cache expired, fetching fresh data');
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting cached insights:', error);
      return null;
    }
  }

  private async updateAnalyticsSnapshot(
    userId: string,
    groupId: string | null,
    dateRange: DateRangeFilter,
    insights: MoodInsights
  ): Promise<void> {
    const snapshotId = this.getCacheKey(userId, groupId, dateRange);
    const snapshotRef = doc(db, this.ANALYTICS_COLLECTION, snapshotId);

    try {
      await setDoc(snapshotRef, {
        userId,
        groupId,
        dateRange,
        insights,
        lastUpdated: serverTimestamp(), // Use server timestamp for more accurate timing
      });
    } catch (error) {
      console.error('Error updating analytics snapshot:', error);
    }
  }

  private scheduleBatchUpdate(
    userId: string,
    groupId: string | null,
    dateRange: DateRangeFilter
  ): void {
    const snapshotId = this.getCacheKey(userId, groupId, dateRange);
    this.pendingUpdates.add(snapshotId);

    if (this.batchUpdateTimeout) {
      clearTimeout(this.batchUpdateTimeout);
    }

    this.batchUpdateTimeout = setTimeout(async () => {
      const updates = Array.from(this.pendingUpdates);
      this.pendingUpdates.clear();

      // Use a batch write for better performance
      const batch = writeBatch(db);

      for (const id of updates) {
        const [userId, groupId, startDate, endDate] = id.split('_');
        const insights = await this.getMoodInsights(userId, { startDate, endDate });
        if (insights) {
          const snapshotRef = doc(db, this.ANALYTICS_COLLECTION, id);
          batch.set(snapshotRef, {
            userId,
            groupId: groupId === 'all' ? null : groupId,
            dateRange: { startDate, endDate },
            insights,
            lastUpdated: serverTimestamp(),
          });
        }
      }

      try {
        await batch.commit();
        console.log(`Batch updated ${updates.length} analytics snapshots`);
      } catch (error) {
        console.error('Error committing batch update:', error);
      }
    }, this.BATCH_UPDATE_DELAY_MS);
  }

  async getMoodInsights(userId: string, dateRange: DateRangeFilter): Promise<MoodInsights> {
    try {
      console.log('Getting mood insights for user:', userId);
      console.log('Date range:', dateRange);

      const cacheKey = this.getCacheKey(userId, null, dateRange);

      // Try to get from Firestore cache first
      const cachedInsights = await this.getCachedInsights(cacheKey);
      if (cachedInsights) {
        return cachedInsights;
      }

      // Get all groups the user is a member of
      const groups = await this.getUserGroups(userId);
      console.log('User groups:', groups);

      if (groups.length === 0) {
        console.log('No groups found for user');
        return this.getEmptyInsights();
      }

      // Get all ratings for the user across all groups
      const allRatings: Rating[] = [];

      // Use Promise.all to fetch ratings from all groups in parallel
      const ratingPromises = groups.map(group => {
        console.log(`Fetching ratings for group ${group.groupId}`);
        return ratingService.getUserRatingsForDateRange(
          group.groupId,
          userId,
          dateRange.startDate,
          dateRange.endDate
        );
      });

      const groupRatings = await Promise.all(ratingPromises);
      groupRatings.forEach((ratings, index) => {
        console.log(`Group ${groups[index].groupId} returned ${ratings.length} ratings`);
        allRatings.push(...ratings);
      });

      console.log(`Total ratings found: ${allRatings.length}`);
      if (allRatings.length > 0) {
        console.log('Sample rating:', allRatings[0]);
      }

      const insights = this.calculateMoodInsights(allRatings);

      // Schedule update of the cache
      this.scheduleBatchUpdate(userId, null, dateRange);

      return insights;
    } catch (error) {
      console.error('Error getting mood insights:', error);
      return this.getEmptyInsights();
    }
  }

  async getGroupMoodInsights(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter
  ): Promise<MoodInsights> {
    try {
      const cacheKey = this.getCacheKey(userId, groupId, dateRange);
      const cachedInsights = await this.getCachedInsights(cacheKey);
      if (cachedInsights) {
        return cachedInsights;
      }

      const ratings = await ratingService.getUserRatingsForDateRange(
        groupId,
        userId,
        dateRange.startDate,
        dateRange.endDate
      );

      const insights = this.calculateMoodInsights(ratings);

      // Schedule update of the cache
      this.scheduleBatchUpdate(userId, groupId, dateRange);

      return insights;
    } catch (error) {
      console.error('Error getting group mood insights:', error);
      // Return empty insights on error
      return {
        overallAverage: 0,
        highestMood: 0,
        lowestMood: 0,
        moodVolatility: 0,
        streakDays: 0,
        totalEntries: 0,
        moodTrends: [],
        dayOfWeekPatterns: [],
        timeOfDayPatterns: [],
        recentRatings: [],
      };
    }
  }

  async getMoodTrends(userId: string, dateRange: DateRangeFilter): Promise<MoodTrend[]> {
    try {
      const cacheKey = this.getCacheKey(userId, null, dateRange);
      const cachedInsights = await this.getCachedInsights(cacheKey);
      if (cachedInsights?.moodTrends) {
        return cachedInsights.moodTrends;
      }

      // Get all groups the user is a member of
      const groups = await this.getUserGroups(userId);

      // Get all ratings for the user across all groups
      const allRatings: Rating[] = [];

      for (const group of groups) {
        const groupRatings = await ratingService.getUserRatingsForDateRange(
          group.groupId,
          userId,
          dateRange.startDate,
          dateRange.endDate
        );

        allRatings.push(...groupRatings);
      }

      const trends = this.calculateMoodTrends(allRatings);

      // Schedule update of the cache with complete insights
      const insights = this.calculateMoodInsights(allRatings);
      this.scheduleBatchUpdate(userId, null, dateRange);

      return trends;
    } catch (error) {
      console.error('Error getting mood trends:', error);
      return [];
    }
  }

  async getGroupMoodTrends(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter
  ): Promise<MoodTrend[]> {
    try {
      const cacheKey = this.getCacheKey(userId, groupId, dateRange);
      const cachedInsights = await this.getCachedInsights(cacheKey);
      if (cachedInsights?.moodTrends) {
        return cachedInsights.moodTrends;
      }

      const ratings = await ratingService.getUserRatingsForDateRange(
        groupId,
        userId,
        dateRange.startDate,
        dateRange.endDate
      );

      const trends = this.calculateMoodTrends(ratings);

      // Schedule update of the cache with complete insights
      const insights = this.calculateMoodInsights(ratings);
      this.scheduleBatchUpdate(userId, groupId, dateRange);

      return trends;
    } catch (error) {
      console.error('Error getting group mood trends:', error);
      return [];
    }
  }

  subscribeToMoodInsights(
    userId: string,
    dateRange: DateRangeFilter,
    callback: (insights: MoodInsights) => void
  ): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('moodInsights', userId);
    console.log(`Setting up mood insights subscription for user ${userId}`);

    // Unsubscribe from any existing subscription
    this.unsubscribe(subscriptionId);

    // First, try to get from cache
    const cacheKey = this.getCacheKey(userId, null, dateRange);
    this.getCachedInsights(cacheKey)
      .then(cachedInsights => {
        if (cachedInsights) {
          console.log('Using cached insights for initial data');
          callback(cachedInsights);
        } else {
          // If no cache, fetch fresh data
          this.getMoodInsights(userId, dateRange)
            .then(insights => {
              console.log('Initial mood insights fetched:', insights);
              callback(insights);
            })
            .catch(error => {
              console.error('Error getting initial mood insights:', error);
              callback(this.getEmptyInsights());
            });
        }
      })
      .catch(error => {
        console.error('Error checking cache:', error);
        // Fallback to fetching fresh data
        this.getMoodInsights(userId, dateRange)
          .then(insights => {
            callback(insights);
          })
          .catch(error => {
            console.error('Error getting initial mood insights:', error);
            callback(this.getEmptyInsights());
          });
      });

    // Set up a subscription to user groups
    const groupsUnsubscribe = groupService.subscribeToUserGroups(userId, async groups => {
      console.log(`Groups update received for user ${userId}:`, groups);

      if (groups.length === 0) {
        console.log('No groups found, returning empty insights');
        callback(this.getEmptyInsights());
        return;
      }

      try {
        // Get all ratings for the user across all groups
        const allRatings: Rating[] = [];
        const ratingPromises = groups.map(group =>
          ratingService.getUserRatingsForDateRange(
            group.groupId,
            userId,
            dateRange.startDate,
            dateRange.endDate
          )
        );

        const groupRatings = await Promise.all(ratingPromises);
        groupRatings.forEach(ratings => allRatings.push(...ratings));

        console.log(`Fetched ${allRatings.length} ratings for user ${userId}`);
        const insights = this.calculateMoodInsights(allRatings);

        // Update cache in the background
        this.scheduleBatchUpdate(userId, null, dateRange);

        callback(insights);
      } catch (error) {
        console.error('Error updating mood insights:', error);
        callback(this.getEmptyInsights());
      }
    });

    // Store the unsubscribe function
    this.activeSubscriptions[subscriptionId] = () => {
      console.log(`Cleaning up subscription ${subscriptionId}`);
      groupsUnsubscribe();
    };

    return () => this.unsubscribe(subscriptionId);
  }

  subscribeToGroupMoodInsights(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter,
    callback: (insights: MoodInsights) => void
  ): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('groupMoodInsights', `${groupId}_${userId}`);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    // First, try to get from cache
    const cacheKey = this.getCacheKey(userId, groupId, dateRange);
    this.getCachedInsights(cacheKey)
      .then(cachedInsights => {
        if (cachedInsights) {
          console.log('Using cached group insights for initial data');
          callback(cachedInsights);
        } else {
          // If no cache, fetch fresh data
          this.getGroupMoodInsights(userId, groupId, dateRange)
            .then(insights => {
              callback(insights);
            })
            .catch(error => {
              console.error('Error getting initial group mood insights:', error);
              callback(this.getEmptyInsights());
            });
        }
      })
      .catch(error => {
        console.error('Error checking cache:', error);
        // Fallback to fetching fresh data
        this.getGroupMoodInsights(userId, groupId, dateRange)
          .then(insights => {
            callback(insights);
          })
          .catch(error => {
            console.error('Error getting initial group mood insights:', error);
            callback(this.getEmptyInsights());
          });
      });

    // Then, set up a subscription to ratings for the date range
    const ratingsUnsubscribe = ratingService.subscribeToRatingsForDateRange(
      groupId,
      dateRange.startDate,
      dateRange.endDate,
      async ratings => {
        try {
          // Filter ratings for the user
          const userRatings = ratings.filter(rating => rating.userId === userId);
          const insights = this.calculateMoodInsights(userRatings);

          // Update cache in the background
          this.scheduleBatchUpdate(userId, groupId, dateRange);

          callback(insights);
        } catch (error) {
          console.error('Error updating group mood insights:', error);
        }
      }
    );

    // Store the unsubscribe function
    this.activeSubscriptions[subscriptionId] = () => {
      ratingsUnsubscribe();
    };

    return () => this.unsubscribe(subscriptionId);
  }

  subscribeToMoodTrends(
    userId: string,
    dateRange: DateRangeFilter,
    callback: (trends: MoodTrend[]) => void
  ): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('moodTrends', userId);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    // First, try to get from cache
    const cacheKey = this.getCacheKey(userId, null, dateRange);
    this.getCachedInsights(cacheKey)
      .then(cachedInsights => {
        if (cachedInsights?.moodTrends) {
          console.log('Using cached mood trends for initial data');
          callback(cachedInsights.moodTrends);
        } else {
          // If no cache, fetch fresh data
          this.getMoodTrends(userId, dateRange)
            .then(trends => {
              callback(trends);
            })
            .catch(error => {
              console.error('Error getting initial mood trends:', error);
              callback([]);
            });
        }
      })
      .catch(error => {
        console.error('Error checking cache:', error);
        // Fallback to fetching fresh data
        this.getMoodTrends(userId, dateRange)
          .then(trends => {
            callback(trends);
          })
          .catch(error => {
            console.error('Error getting initial mood trends:', error);
            callback([]);
          });
      });

    // Then, set up a subscription to user groups
    const groupsUnsubscribe = groupService.subscribeToUserGroups(userId, async groups => {
      try {
        // Get all ratings for the user across all groups
        const allRatings: Rating[] = [];
        const ratingPromises = groups.map(group =>
          ratingService.getUserRatingsForDateRange(
            group.groupId,
            userId,
            dateRange.startDate,
            dateRange.endDate
          )
        );

        const groupRatings = await Promise.all(ratingPromises);
        groupRatings.forEach(ratings => allRatings.push(...ratings));

        const trends = this.calculateMoodTrends(allRatings);

        // Update cache in the background
        this.scheduleBatchUpdate(userId, null, dateRange);

        callback(trends);
      } catch (error) {
        console.error('Error updating mood trends:', error);
      }
    });

    // Store the unsubscribe function
    this.activeSubscriptions[subscriptionId] = () => {
      groupsUnsubscribe();
    };

    return () => this.unsubscribe(subscriptionId);
  }

  subscribeToGroupMoodTrends(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter,
    callback: (trends: MoodTrend[]) => void
  ): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('groupMoodTrends', `${groupId}_${userId}`);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    // First, try to get from cache
    const cacheKey = this.getCacheKey(userId, groupId, dateRange);
    this.getCachedInsights(cacheKey)
      .then(cachedInsights => {
        if (cachedInsights?.moodTrends) {
          console.log('Using cached group mood trends for initial data');
          callback(cachedInsights.moodTrends);
        } else {
          // If no cache, fetch fresh data
          this.getGroupMoodTrends(userId, groupId, dateRange)
            .then(trends => {
              callback(trends);
            })
            .catch(error => {
              console.error('Error getting initial group mood trends:', error);
              callback([]);
            });
        }
      })
      .catch(error => {
        console.error('Error checking cache:', error);
        // Fallback to fetching fresh data
        this.getGroupMoodTrends(userId, groupId, dateRange)
          .then(trends => {
            callback(trends);
          })
          .catch(error => {
            console.error('Error getting initial group mood trends:', error);
            callback([]);
          });
      });

    // Then, set up a subscription to ratings for the date range
    const ratingsUnsubscribe = ratingService.subscribeToRatingsForDateRange(
      groupId,
      dateRange.startDate,
      dateRange.endDate,
      async ratings => {
        try {
          // Filter ratings for the user
          const userRatings = ratings.filter(rating => rating.userId === userId);
          const trends = this.calculateMoodTrends(userRatings);

          // Update cache in the background
          this.scheduleBatchUpdate(userId, groupId, dateRange);

          callback(trends);
        } catch (error) {
          console.error('Error updating group mood trends:', error);
        }
      }
    );

    // Store the unsubscribe function
    this.activeSubscriptions[subscriptionId] = () => {
      ratingsUnsubscribe();
    };

    return () => this.unsubscribe(subscriptionId);
  }

  getDayOfWeekPatterns(ratings: Rating[]): MoodPattern[] {
    if (ratings.length === 0) {
      return Array(7)
        .fill(0)
        .map((_, i) => ({ dayOfWeek: i, averageRating: 0, count: 0 }));
    }

    const patterns: MoodPattern[] = [];
    const dayCounts: Record<number, { sum: number; count: number }> = {};

    // Initialize day counts
    for (let i = 0; i < 7; i++) {
      dayCounts[i] = { sum: 0, count: 0 };
    }

    // Calculate sums and counts for each day of week
    ratings.forEach(rating => {
      const date = new Date(rating.ratingDate);
      const dayOfWeek = date.getDay();

      dayCounts[dayOfWeek].sum += rating.ratingNumber;
      dayCounts[dayOfWeek].count += 1;
    });

    // Calculate averages for each day
    for (let i = 0; i < 7; i++) {
      const { sum, count } = dayCounts[i];
      patterns.push({
        dayOfWeek: i,
        averageRating: count > 0 ? sum / count : 0,
        count,
      });
    }

    return patterns;
  }

  getTimeOfDayPatterns(ratings: Rating[]): TimeOfDayPattern[] {
    if (ratings.length === 0) {
      return Array(24)
        .fill(0)
        .map((_, i) => ({ hour: i, averageRating: 0, count: 0 }));
    }

    const patterns: TimeOfDayPattern[] = [];
    const hourCounts: Record<number, { sum: number; count: number }> = {};

    // Initialize hour counts
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = { sum: 0, count: 0 };
    }

    // Calculate sums and counts for each hour
    ratings.forEach(rating => {
      const createdAt = rating.createdAt as Timestamp;
      const date = createdAt.toDate();
      const hour = date.getHours();

      hourCounts[hour].sum += rating.ratingNumber;
      hourCounts[hour].count += 1;
    });

    // Calculate averages for each hour
    for (let i = 0; i < 24; i++) {
      const { sum, count } = hourCounts[i];
      patterns.push({
        hour: i,
        averageRating: count > 0 ? sum / count : 0,
        count,
      });
    }

    return patterns;
  }

  calculateMoodVolatility(ratings: Rating[]): number {
    if (ratings.length === 0) return 0;

    // Calculate mean
    const sum = ratings.reduce((acc, rating) => acc + rating.ratingNumber, 0);
    const mean = sum / ratings.length;

    // Calculate variance
    const squaredDiffs = ratings.map(rating => Math.pow(rating.ratingNumber - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / ratings.length;

    // Calculate standard deviation
    return Math.sqrt(variance);
  }

  calculateStreakDays(ratings: Rating[]): number {
    if (ratings.length === 0) return 0;

    // Sort ratings by date (newest first)
    const sortedRatings = [...ratings].sort(
      (a, b) => new Date(b.ratingDate).getTime() - new Date(a.ratingDate).getTime()
    );

    // Check if the most recent rating is from today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecentDate = new Date(sortedRatings[0].ratingDate);
    mostRecentDate.setHours(0, 0, 0, 0);

    // If the most recent rating is not from today or yesterday, streak is broken
    if (mostRecentDate < yesterday) {
      return 0;
    }

    // Calculate streak
    let streak = 1;
    let currentDate = mostRecentDate;

    for (let i = 1; i < sortedRatings.length; i++) {
      const ratingDate = new Date(sortedRatings[i].ratingDate);
      ratingDate.setHours(0, 0, 0, 0);

      // Calculate the expected previous date
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - 1);

      // If the rating is from the expected date, increment streak
      if (ratingDate.getTime() === expectedDate.getTime()) {
        streak++;
        currentDate = ratingDate;
      } else {
        // Streak is broken
        break;
      }
    }

    return streak;
  }

  getDateRangeForTimeRange(timeRange: TimeRange): DateRangeFilter {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);

    switch (timeRange) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        // Set to a reasonable past date (e.g., 5 years ago)
        startDate.setFullYear(today.getFullYear() - 5);
        break;
      case 'custom':
        // For custom, we'll use the default (all time)
        startDate.setFullYear(today.getFullYear() - 5);
        break;
    }

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    console.log(`Date range: ${formatDate(startDate)} to ${formatDate(today)}`);

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(today),
    };
  }

  private async getUserGroups(userId: string): Promise<{ groupId: string }[]> {
    try {
      // Use the groupService to get all groups the user is a member of
      const groups = await groupService.getUserGroups(userId);

      // Map the groups to the expected format
      return groups.map(group => ({ groupId: group.groupId }));
    } catch (error) {
      console.error('Error getting user groups:', error);
      return [];
    }
  }

  private calculateMoodInsights(ratings: Rating[]): MoodInsights {
    if (ratings.length === 0) {
      return this.getEmptyInsights();
    }

    // Calculate basic statistics
    const totalEntries = ratings.length;
    const sum = ratings.reduce((acc, rating) => acc + rating.ratingNumber, 0);
    const overallAverage = sum / totalEntries;

    const ratingValues = ratings.map(r => r.ratingNumber);
    const highestMood = Math.max(...ratingValues);
    const lowestMood = Math.min(...ratingValues);

    // Calculate mood volatility
    const moodVolatility = this.calculateMoodVolatility(ratings);

    // Calculate streak days
    const streakDays = this.calculateStreakDays(ratings);

    // Calculate mood trends
    const moodTrends = this.calculateMoodTrends(ratings);

    // Calculate day of week patterns
    const dayOfWeekPatterns = this.getDayOfWeekPatterns(ratings);

    // Calculate time of day patterns
    const timeOfDayPatterns = this.getTimeOfDayPatterns(ratings);

    // Get recent ratings (last 10)
    const recentRatings = [...ratings]
      .sort((a, b) => new Date(b.ratingDate).getTime() - new Date(a.ratingDate).getTime())
      .slice(0, 10);

    return {
      overallAverage,
      highestMood,
      lowestMood,
      moodVolatility,
      streakDays,
      totalEntries,
      moodTrends,
      dayOfWeekPatterns,
      timeOfDayPatterns,
      recentRatings,
    };
  }

  private calculateMoodTrends(ratings: Rating[]): MoodTrend[] {
    if (ratings.length === 0) return [];

    // Group ratings by date
    const ratingsByDate: Record<string, { sum: number; count: number }> = {};

    ratings.forEach(rating => {
      if (!ratingsByDate[rating.ratingDate]) {
        ratingsByDate[rating.ratingDate] = { sum: 0, count: 0 };
      }

      ratingsByDate[rating.ratingDate].sum += rating.ratingNumber;
      ratingsByDate[rating.ratingDate].count += 1;
    });

    // Convert to array of MoodTrend objects
    const trends: MoodTrend[] = Object.entries(ratingsByDate).map(([date, { sum, count }]) => ({
      date,
      averageRating: sum / count,
      count,
    }));

    // Sort by date
    return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private getEmptyInsights(): MoodInsights {
    return {
      overallAverage: 0,
      highestMood: 0,
      lowestMood: 0,
      moodVolatility: 0,
      streakDays: 0,
      totalEntries: 0,
      moodTrends: [],
      dayOfWeekPatterns: [],
      timeOfDayPatterns: [],
      recentRatings: [],
    };
  }

  public cleanup(): void {
    this.unsubscribeAll();
    if (this.batchUpdateTimeout) {
      clearTimeout(this.batchUpdateTimeout);
      this.batchUpdateTimeout = null;
    }
  }
}

export const personalAnalyticsService: PersonalAnalyticsService =
  new FirestorePersonalAnalyticsService();
