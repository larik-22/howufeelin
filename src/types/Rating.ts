import { Timestamp } from 'firebase/firestore';

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
