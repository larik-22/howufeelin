import { Timestamp } from 'firebase/firestore';
import { GroupMemberRole } from '@/types/GroupMemberRole';

export interface Group {
  groupId: string;
  groupName: string;
  groupDescription: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  joinCode: string;
  userRole?: GroupMemberRole; // Optional because it's added after fetching
}
