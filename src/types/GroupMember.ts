import { Timestamp } from 'firebase/firestore';

export interface GroupMember {
  role: 'member' | 'moderator' | 'admin';
  status: 'active' | 'pending' | 'invited' | 'banned';
  joinDate: Timestamp;
  displayName?: string;
}
