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
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Rating, RATING_MIN, RATING_MAX, isValidRating, createRatingId } from '@/types/Rating';

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
}

class FirestoreRatingService implements RatingService {
  private readonly COLLECTION = 'ratings';
  private readonly MAX_RATINGS_PER_QUERY = 1000;

  private getRatingDocRef(ratingId: string) {
    return doc(db, this.COLLECTION, ratingId);
  }

  private getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private validateRatingInput(ratingNumber: number, notes?: string) {
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

  async createRating(
    groupId: string,
    userId: string,
    ratingNumber: number,
    notes?: string
  ): Promise<Rating> {
    try {
      this.validateRatingInput(ratingNumber, notes);

      const now = Timestamp.now();
      const today = this.getTodayString();
      const ratingId = createRatingId(groupId, today, userId);
      const ratingRef = this.getRatingDocRef(ratingId);

      // Check if rating already exists
      const existingRating = await getDoc(ratingRef);
      if (existingRating.exists()) {
        throw new RatingError('User has already rated today', 'ALREADY_RATED');
      }

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

      await setDoc(ratingRef, rating);
      return rating;
    } catch (error) {
      if (error instanceof RatingError) {
        throw error;
      }
      console.error('Error creating rating:', error);
      throw new RatingError('Failed to create rating', 'CREATE_FAILED');
    }
  }

  async getGroupRatingsForDate(groupId: string, date: string): Promise<Rating[]> {
    try {
      const prefix = `${groupId}_${date}_`;
      const q = query(
        collection(db, this.COLLECTION),
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

  async getGroupRatingsForDateRange(
    groupId: string,
    startDate: string,
    endDate: string
  ): Promise<Rating[]> {
    try {
      const startPrefix = `${groupId}_${startDate}_`;
      const endPrefix = `${groupId}_${endDate}_`;

      const q = query(
        collection(db, this.COLLECTION),
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

  async getUserRatingForDate(
    groupId: string,
    userId: string,
    date: string
  ): Promise<Rating | null> {
    try {
      const ratingId = createRatingId(groupId, date, userId);
      const ratingRef = this.getRatingDocRef(ratingId);
      const ratingDoc = await getDoc(ratingRef);

      if (!ratingDoc.exists()) {
        return null;
      }

      return ratingDoc.data() as Rating;
    } catch (error) {
      console.error('Error getting user rating for date:', error);
      return null;
    }
  }

  async getUserRatingsForDateRange(
    groupId: string,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Rating[]> {
    try {
      // Instead of making multiple individual queries, use a single query with a range
      // This is more efficient than querying for each date individually
      const startPrefix = `${groupId}_${startDate}_${userId}`;
      const endPrefix = `${groupId}_${endDate}_${userId}`;

      const q = query(
        collection(db, 'ratings'),
        where('ratingId', '>=', startPrefix),
        where('ratingId', '<=', endPrefix)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Rating);
    } catch (error) {
      console.error('Error getting user ratings for date range:', error);
      return [];
    }
  }

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

  async hasUserRatedToday(groupId: string, userId: string): Promise<boolean> {
    try {
      const today = this.getTodayString();
      const ratingId = createRatingId(groupId, today, userId);
      const ratingRef = this.getRatingDocRef(ratingId);
      const ratingDoc = await getDoc(ratingRef);

      return ratingDoc.exists();
    } catch (error) {
      console.error('Error checking if user has rated today:', error);
      return false;
    }
  }
}

export const ratingService: RatingService = new FirestoreRatingService();
