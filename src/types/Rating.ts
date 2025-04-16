import { Timestamp } from 'firebase/firestore';

export const RATING_MIN = 1;
export const RATING_MAX = 10;
export const RATING_DEFAULT = 5;

export interface Rating {
  ratingId: string;
  groupId: string;
  userId: string;
  ratingDate: string;
  ratingNumber: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function isValidRating(rating: number): boolean {
  return rating >= RATING_MIN && rating <= RATING_MAX && Number.isInteger(rating);
}

export function createRatingId(groupId: string, date: string, userId: string): string {
  return `${groupId}_${date}_${userId}`;
}
