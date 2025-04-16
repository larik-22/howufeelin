import { Timestamp } from 'firebase/firestore';

export interface Group {
  groupId: string;
  groupName: string;
  groupDescription: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  joinCode: string;
}
