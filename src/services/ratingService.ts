import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
  DocumentReference,
  getDocFromCache,
  getDocFromServer,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Rating, RATING_MIN, RATING_MAX, isValidRating, createRatingId } from '@/types/Rating';
import { analyticsService } from '@/services/analyticsService';
import { emailService } from './emailService';
import { groupService } from './groupService';

export class RatingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RatingError';
  }
}

export interface RatingService {
  // Create a new rating
  createRating(
    groupId: string,
    userId: string,
    ratingNumber: number,
    notes?: string
  ): Promise<Rating>;

  // Get a user's rating for a specific date
  getUserRatingForDate(groupId: string, userId: string, date: string): Promise<Rating | null>;

  // Get all ratings for a group on a specific date
  getGroupRatingsForDate(groupId: string, date: string): Promise<Rating[]>;

  // Get a user's ratings for a date range
  getUserRatingsForDateRange(
    groupId: string,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Rating[]>;

  // Get a group's ratings for a date range
  getGroupRatingsForDateRange(
    groupId: string,
    startDate: string,
    endDate: string
  ): Promise<Rating[]>;

  // Update an existing rating
  updateRating(
    ratingId: string,
    updates: Partial<Omit<Rating, 'ratingId' | 'groupId' | 'userId' | 'ratingDate' | 'createdAt'>>
  ): Promise<void>;

  // Delete a rating
  deleteRating(ratingId: string): Promise<void>;

  // Delete all ratings for a group
  deleteAllRatingsForGroup(groupId: string): Promise<void>;

  // Check if a user has already rated today
  hasUserRatedToday(groupId: string, userId: string): Promise<boolean>;

  // Get all necessary rating data for the group detail page
  getGroupDetailRatings(
    groupId: string,
    userId: string
  ): Promise<{
    todayRatings: Rating[];
    calendarRatings: Rating[];
    hasRatedToday: boolean;
  }>;

  // Subscribe to today's ratings for a group
  subscribeToTodayRatings(groupId: string, callback: (ratings: Rating[]) => void): Unsubscribe;

  // Subscribe to a user's rating for today
  subscribeToUserTodayRating(
    groupId: string,
    userId: string,
    callback: (rating: Rating | null) => void
  ): Unsubscribe;

  // Subscribe to ratings for a date range
  subscribeToRatingsForDateRange(
    groupId: string,
    startDate: string,
    endDate: string,
    callback: (ratings: Rating[]) => void
  ): Unsubscribe;

  // Check if a subscription is active
  isSubscriptionActive(type: string, id: string): boolean;

  // Unsubscribe from all active subscriptions
  unsubscribeAll(): void;
}

class FirestoreRatingService implements RatingService {
  private readonly COLLECTION = 'ratings';
  private readonly MAX_RATINGS_PER_QUERY = 1000;
  private activeSubscriptions: Record<string, Unsubscribe> = {};
  private ratingsCollection = collection(db, this.COLLECTION);
  private membersCollection = collection(db, 'groupMembers');

  /**
   * Get a document reference for a rating
   */
  private getRatingDocRef(ratingId: string): DocumentReference {
    return doc(this.ratingsCollection, ratingId);
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Validate rating input
   */
  private validateRatingInput(ratingNumber: number, notes?: string): void {
    if (!isValidRating(ratingNumber)) {
      throw new RatingError(
        `Rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`,
        'INVALID_RATING'
      );
    }

    if (notes && notes.length > 500) {
      throw new RatingError('Notes must be less than 500 characters', 'INVALID_NOTES');
    }
  }

  /**
   * Generate a unique subscription ID
   */
  private generateSubscriptionId(type: string, id: string): string {
    return `${type}_${id}`;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  private unsubscribe(subscriptionId: string): void {
    if (this.activeSubscriptions[subscriptionId]) {
      console.log(`Unsubscribing from ${subscriptionId}`);
      this.activeSubscriptions[subscriptionId]();
      delete this.activeSubscriptions[subscriptionId];
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  public unsubscribeAll(): void {
    const count = Object.keys(this.activeSubscriptions).length;
    if (count > 0) {
      console.log(`Unsubscribing from ${count} active subscriptions`);
      Object.keys(this.activeSubscriptions).forEach(id => {
        this.unsubscribe(id);
      });
    }
  }

  /**
   * Check if a subscription is active
   */
  public isSubscriptionActive(type: string, id: string): boolean {
    const subscriptionId = this.generateSubscriptionId(type, id);
    return !!this.activeSubscriptions[subscriptionId];
  }

  /**
   * Delete all ratings for a group
   */
  async deleteAllRatingsForGroup(groupId: string): Promise<void> {
    try {
      // Query all ratings for this group
      const q = query(this.ratingsCollection, where('groupId', '==', groupId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`No ratings found for group ${groupId}`);
        return; // No ratings to delete
      }

      // Use a batch to delete all ratings in a single transaction
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${querySnapshot.size} ratings for group ${groupId}`);
    } catch (error) {
      console.error('Error deleting all ratings for group:', error);
      throw new RatingError('Failed to delete all ratings for group', 'DELETE_FAILED');
    }
  }

  /**
   * Create a new rating
   */
  async createRating(
    groupId: string,
    userId: string,
    ratingNumber: number,
    notes?: string
  ): Promise<Rating> {
    try {
      // Check if user is banned
      const isBanned = await this.checkBannedStatus(groupId, userId);
      if (isBanned) {
        throw new RatingError('You cannot rate in this group as you are banned', 'BANNED');
      }

      // Validate rating number
      if (ratingNumber < 1 || ratingNumber > 10) {
        throw new RatingError('Rating must be between 1 and 10', 'INVALID_RATING');
      }

      // Validate notes length
      if (notes && notes.length > 500) {
        throw new RatingError('Notes must be less than 500 characters', 'INVALID_NOTES');
      }

      // Check if user has already rated today
      const hasRated = await this.hasUserRatedToday(groupId, userId);
      if (hasRated) {
        throw new RatingError('You have already rated today', 'ALREADY_RATED');
      }

      // Create the rating
      const today = this.getTodayString();
      const ratingId = createRatingId(groupId, today, userId);
      const now = Timestamp.now();

      const rating: Rating = {
        ratingId,
        groupId,
        userId,
        ratingDate: today,
        ratingNumber,
        notes,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(this.ratingsCollection, ratingId), rating);

      // Track rating submission
      analyticsService.trackRatingSubmit(groupId, ratingNumber);

      // Send email notifications to group members
      try {
        // Get group and member information
        const [group, members] = await Promise.all([
          groupService.getGroupById(groupId),
          groupService.getGroupMembers(groupId),
        ]);

        if (group) {
          // Get the user who created the rating
          const ratingUser = members.find(m => m.userId === userId);

          if (ratingUser) {
            // Send notifications to all other members
            const notificationPromises = members
              .filter(member => member.userId !== userId && member.email)
              .map(member =>
                emailService.sendRatingNotification({
                  to_email: member.email!,
                  to_name: member.displayName,
                  from_name: ratingUser.displayName,
                  group_name: group.groupName,
                  rating: ratingNumber,
                  note: notes,
                })
              );

            // Send notifications in parallel
            await Promise.allSettled(notificationPromises);
          }
        }
      } catch (error) {
        // Log error but don't fail the rating creation
        console.error('Failed to send email notifications:', error);
      }

      return rating;
    } catch (error) {
      console.error('Error creating rating:', error);
      if (error instanceof RatingError) {
        throw error;
      }
      throw new RatingError('Failed to create rating', 'CREATE_FAILED');
    }
  }

  /**
   * Get all ratings for a group on a specific date
   */
  async getGroupRatingsForDate(groupId: string, date: string): Promise<Rating[]> {
    try {
      const prefix = `${groupId}_${date}_`;
      const q = query(
        this.ratingsCollection,
        where('ratingId', '>=', prefix),
        where('ratingId', '<=', prefix + '\uf8ff'),
        orderBy('ratingId'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Rating);
    } catch (error) {
      console.error('Error getting group ratings for date:', error);
      return [];
    }
  }

  /**
   * Get a group's ratings for a date range
   */
  async getGroupRatingsForDateRange(
    groupId: string,
    startDate: string,
    endDate: string
  ): Promise<Rating[]> {
    try {
      const startPrefix = `${groupId}_${startDate}_`;
      const endPrefix = `${groupId}_${endDate}_`;

      const q = query(
        this.ratingsCollection,
        where('ratingId', '>=', startPrefix),
        where('ratingId', '<=', endPrefix + '\uf8ff'),
        orderBy('ratingId'),
        orderBy('createdAt', 'desc'),
        limit(this.MAX_RATINGS_PER_QUERY)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Rating);
    } catch (error) {
      console.error('Error getting group ratings for date range:', error);
      return [];
    }
  }

  /**
   * Get all necessary rating data for the group detail page
   */
  async getGroupDetailRatings(
    groupId: string,
    userId: string
  ): Promise<{
    todayRatings: Rating[];
    calendarRatings: Rating[];
    hasRatedToday: boolean;
  }> {
    try {
      const today = this.getTodayString();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      // Create all promises
      const [todayRatings, calendarRatings, userTodayRating] = await Promise.all([
        this.getGroupRatingsForDate(groupId, today),
        this.getGroupRatingsForDateRange(groupId, thirtyDaysAgoStr, today),
        this.getUserRatingForDate(groupId, userId, today),
      ]);

      return {
        todayRatings,
        calendarRatings,
        hasRatedToday: !!userTodayRating,
      };
    } catch (error) {
      console.error('Error getting group detail ratings:', error);
      return {
        todayRatings: [],
        calendarRatings: [],
        hasRatedToday: false,
      };
    }
  }

  /**
   * Get a user's rating for a specific date
   */
  async getUserRatingForDate(
    groupId: string,
    userId: string,
    date: string
  ): Promise<Rating | null> {
    try {
      const ratingId = createRatingId(groupId, date, userId);
      const ratingRef = this.getRatingDocRef(ratingId);

      // Try to get from cache first
      try {
        const cachedDoc = await getDocFromCache(ratingRef);
        if (cachedDoc.exists()) {
          return cachedDoc.data() as Rating;
        }
      } catch {
        // If not in cache, continue to server
        console.log('Rating not found in cache, fetching from server');
      }

      // If not in cache, get from server
      const ratingDoc = await getDocFromServer(ratingRef);

      if (!ratingDoc.exists()) {
        return null;
      }

      return ratingDoc.data() as Rating;
    } catch (error) {
      console.error('Error getting user rating for date:', error);
      return null;
    }
  }

  /**
   * Get a user's ratings for a date range
   */
  async getUserRatingsForDateRange(
    groupId: string,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Rating[]> {
    try {
      console.log('Getting user ratings for date range:', {
        groupId,
        userId,
        startDate,
        endDate,
      });

      // Create a query to get all ratings for the user in the group within the date range
      const q = query(
        this.ratingsCollection,
        where('groupId', '==', groupId),
        where('userId', '==', userId),
        where('ratingDate', '>=', startDate),
        where('ratingDate', '<=', endDate),
        orderBy('ratingDate', 'desc')
      );

      console.log('Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log(`Query returned ${querySnapshot.size} documents`);

      const ratings = querySnapshot.docs.map(doc => doc.data() as Rating);
      console.log('Ratings:', ratings);
      return ratings;
    } catch (error) {
      console.error('Error getting user ratings for date range:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return [];
    }
  }

  /**
   * Update an existing rating
   */
  async updateRating(
    ratingId: string,
    updates: Partial<Omit<Rating, 'ratingId' | 'groupId' | 'userId' | 'ratingDate' | 'createdAt'>>
  ): Promise<void> {
    try {
      if (updates.ratingNumber !== undefined) {
        this.validateRatingInput(updates.ratingNumber, updates.notes);
      }

      const ratingRef = this.getRatingDocRef(ratingId);
      const ratingDoc = await getDoc(ratingRef);

      if (!ratingDoc.exists()) {
        throw new RatingError('Rating not found', 'NOT_FOUND');
      }

      const updatedData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(ratingRef, updatedData);
    } catch (error) {
      if (error instanceof RatingError) {
        throw error;
      }
      console.error('Error updating rating:', error);
      throw new RatingError('Failed to update rating', 'UPDATE_FAILED');
    }
  }

  /**
   * Delete a rating
   */
  async deleteRating(ratingId: string): Promise<void> {
    try {
      const ratingRef = this.getRatingDocRef(ratingId);
      const ratingDoc = await getDoc(ratingRef);

      if (!ratingDoc.exists()) {
        throw new RatingError('Rating not found', 'NOT_FOUND');
      }

      await deleteDoc(ratingRef);
    } catch (error) {
      if (error instanceof RatingError) {
        throw error;
      }
      console.error('Error deleting rating:', error);
      throw new RatingError('Failed to delete rating', 'DELETE_FAILED');
    }
  }

  /**
   * Check if a user has already rated today
   */
  async hasUserRatedToday(groupId: string, userId: string): Promise<boolean> {
    try {
      const today = this.getTodayString();
      const ratingId = createRatingId(groupId, today, userId);
      const ratingRef = this.getRatingDocRef(ratingId);

      // Try to get from cache first
      try {
        const cachedDoc = await getDocFromCache(ratingRef);
        return cachedDoc.exists();
      } catch {
        // If not in cache, continue to server
        console.log('Rating not found in cache, checking server');
      }

      // If not in cache, get from server
      const ratingDoc = await getDocFromServer(ratingRef);
      return ratingDoc.exists();
    } catch (error) {
      console.error('Error checking if user has rated today:', error);
      return false;
    }
  }

  /**
   * Subscribe to today's ratings for a group
   */
  subscribeToTodayRatings(groupId: string, callback: (ratings: Rating[]) => void): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('todayRatings', groupId);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    const today = this.getTodayString();
    const prefix = `${groupId}_${today}_`;

    const q = query(
      this.ratingsCollection,
      where('ratingId', '>=', prefix),
      where('ratingId', '<=', prefix + '\uf8ff'),
      orderBy('ratingId'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const ratings = querySnapshot.docs.map(doc => doc.data() as Rating);
        callback(ratings);
      },
      error => {
        console.error('Error subscribing to today ratings:', error);
        callback([]);
      }
    );

    // Store the subscription
    this.activeSubscriptions[subscriptionId] = unsubscribe;

    return unsubscribe;
  }

  /**
   * Subscribe to a user's rating for today
   */
  subscribeToUserTodayRating(
    groupId: string,
    userId: string,
    callback: (rating: Rating | null) => void
  ): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId('userTodayRating', `${groupId}_${userId}`);

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    const today = this.getTodayString();
    const ratingId = createRatingId(groupId, today, userId);
    const ratingRef = this.getRatingDocRef(ratingId);

    const unsubscribe = onSnapshot(
      ratingRef,
      doc => {
        if (doc.exists()) {
          callback(doc.data() as Rating);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error subscribing to user today rating:', error);
        callback(null);
      }
    );

    // Store the subscription
    this.activeSubscriptions[subscriptionId] = unsubscribe;

    return unsubscribe;
  }

  /**
   * Subscribe to ratings for a date range
   */
  subscribeToRatingsForDateRange(
    groupId: string,
    startDate: string,
    endDate: string,
    callback: (ratings: Rating[]) => void
  ): Unsubscribe {
    const subscriptionId = this.generateSubscriptionId(
      'dateRangeRatings',
      `${groupId}_${startDate}_${endDate}`
    );

    // Unsubscribe from any existing subscription with the same ID
    this.unsubscribe(subscriptionId);

    const startPrefix = `${groupId}_${startDate}_`;
    const endPrefix = `${groupId}_${endDate}_`;

    const q = query(
      this.ratingsCollection,
      where('ratingId', '>=', startPrefix),
      where('ratingId', '<=', endPrefix + '\uf8ff'),
      orderBy('ratingId'),
      orderBy('createdAt', 'desc'),
      limit(this.MAX_RATINGS_PER_QUERY)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const ratings = querySnapshot.docs.map(doc => doc.data() as Rating);
        callback(ratings);
      },
      error => {
        console.error('Error subscribing to ratings for date range:', error);
        callback([]);
      }
    );

    // Store the subscription
    this.activeSubscriptions[subscriptionId] = unsubscribe;

    return unsubscribe;
  }

  private async checkBannedStatus(groupId: string, userId: string): Promise<boolean> {
    try {
      const memberDocId = `${groupId}_${userId}`;
      const memberDoc = await getDoc(doc(this.membersCollection, memberDocId));

      if (!memberDoc.exists()) {
        return false;
      }

      const memberData = memberDoc.data();
      return memberData.role === 'banned';
    } catch (error) {
      console.error('Error checking banned status:', error);
      return false;
    }
  }
}

export const ratingService: RatingService = new FirestoreRatingService();
