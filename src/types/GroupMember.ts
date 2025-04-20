import { Timestamp } from 'firebase/firestore';
import { GroupMemberRole } from '@/types/GroupMemberRole';

export interface GroupMember {
  groupId: string; // For querying members of a group
  userId: string; // For querying user's groups
  email: string;
  displayName: string;
  role: GroupMemberRole;
  joinedAt: Timestamp;
  photoURL: string | null; // Optional field for user's profile image URL
}
