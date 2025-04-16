import { DocumentReference } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { MyUser } from './MyUser';

export interface Group {
  groupId: string;
  groupName: string;
  groupDescription: string;
  createdBy: DocumentReference<MyUser>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  joinCode: string;
}
