import { DocumentReference } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { User } from './MyUser';

export interface Group {
  groupId: string;
  groupName: string;
  groupDescription: string;
  createdBy: DocumentReference<User>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
