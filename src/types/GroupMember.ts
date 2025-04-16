import { Timestamp } from 'firebase/firestore';
import { GroupMemberRole } from '@/services/groupService';

export interface GroupMember {
  groupId: string; // For querying members of a group
  userId: string; // For querying user's groups
  email: string;
  displayName: string;
  role: GroupMemberRole;
  joinedAt: Timestamp;
}
