import { Timestamp } from 'firebase/firestore';
import { GroupMemberRole } from '@/services/groupService';

export interface GroupMember {
  groupId: string; // For querying members of a group
  userId: string; // For querying user's groups
  role: GroupMemberRole;
  joinedAt: Timestamp;
}
