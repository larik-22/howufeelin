import { Timestamp } from 'firebase/firestore';
import { ratingService } from './ratingService';
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
}

class FirestorePersonalAnalyticsService implements PersonalAnalyticsService {
  async getMoodInsights(userId: string, dateRange: DateRangeFilter): Promise<MoodInsights> {
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

    return this.calculateMoodInsights(allRatings);
  }

  async getGroupMoodInsights(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter
  ): Promise<MoodInsights> {
    const ratings = await ratingService.getUserRatingsForDateRange(
      groupId,
      userId,
      dateRange.startDate,
      dateRange.endDate
    );

    return this.calculateMoodInsights(ratings);
  }

  async getMoodTrends(userId: string, dateRange: DateRangeFilter): Promise<MoodTrend[]> {
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

    return this.calculateMoodTrends(allRatings);
  }

  async getGroupMoodTrends(
    userId: string,
    groupId: string,
    dateRange: DateRangeFilter
  ): Promise<MoodTrend[]> {
    const ratings = await ratingService.getUserRatingsForDateRange(
      groupId,
      userId,
      dateRange.startDate,
      dateRange.endDate
    );

    return this.calculateMoodTrends(ratings);
  }

  getDayOfWeekPatterns(ratings: Rating[]): MoodPattern[] {
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
    const patterns: TimeOfDayPattern[] = [];
    const hourCounts: Record<number, { sum: number; count: number }> = {};

    // Initialize hour counts
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = { sum: 0, count: 0 };
    }

    // Calculate sums and counts for each hour
    ratings.forEach(rating => {
      // Since we don't store time in ratings, we'll use the creation timestamp
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

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  }

  private async getUserGroups(userId: string): Promise<{ groupId: string }[]> {
    // This is a placeholder - you'll need to implement this based on your group service
    // For now, we'll return an empty array
    return [];
  }

  private calculateMoodInsights(ratings: Rating[]): MoodInsights {
    if (ratings.length === 0) {
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
}

export const personalAnalyticsService: PersonalAnalyticsService =
  new FirestorePersonalAnalyticsService();
