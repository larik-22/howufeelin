import { Timestamp } from 'firebase/firestore';

export interface UserProfileSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReport: boolean;
  updatedAt: Timestamp;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UsernameChangeRequest {
  newUsername: string;
  password: string;
}
