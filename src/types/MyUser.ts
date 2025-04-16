import { Timestamp } from 'firebase/firestore';

export interface MyUser {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
