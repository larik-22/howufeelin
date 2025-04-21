import { doc, getDoc, setDoc, updateDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { UserProfileSettings } from '@/types/UserProfile';
import {
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { userService } from './userService';

export interface ProfileService {
  // Get user profile settings
  getUserProfileSettings(userId: string): Promise<UserProfileSettings | null>;

  // Update user profile settings
  updateUserProfileSettings(userId: string, settings: Partial<UserProfileSettings>): Promise<void>;

  // Change user password
  changePassword(currentPassword: string, newPassword: string): Promise<void>;

  // Change username
  changeUsername(newUsername: string, password: string): Promise<void>;

  // Initialize user profile settings
  initializeUserProfileSettings(userId: string): Promise<UserProfileSettings>;
}

class FirestoreProfileService implements ProfileService {
  private readonly COLLECTION = 'userProfiles';
  private profilesCollection = collection(db, this.COLLECTION);

  async getUserProfileSettings(userId: string): Promise<UserProfileSettings | null> {
    const profileDoc = await getDoc(doc(this.profilesCollection, userId));
    return profileDoc.exists() ? (profileDoc.data() as UserProfileSettings) : null;
  }

  async updateUserProfileSettings(
    userId: string,
    settings: Partial<UserProfileSettings>
  ): Promise<void> {
    const profileRef = doc(this.profilesCollection, userId);
    const now = Timestamp.now();

    // Get the current profile data
    const profileDoc = await getDoc(profileRef);

    if (!profileDoc.exists()) {
      // If profile doesn't exist, create it with default settings
      const defaultSettings: UserProfileSettings = {
        userId,
        theme: 'system',
        emailNotifications: true,
        pushNotifications: true,
        weeklyReport: false,
        updatedAt: now,
      };

      await setDoc(profileRef, {
        ...defaultSettings,
        ...settings,
        updatedAt: now,
      });
      return;
    }

    // Update existing profile
    await updateDoc(profileRef, {
      ...settings,
      updatedAt: now,
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  }

  async changeUsername(newUsername: string, password: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Check if username is taken
    const isTaken = await userService.isUsernameTaken(newUsername, user.uid);
    if (isTaken) {
      throw new Error('Username is already taken');
    }

    // Update username
    await userService.updateUser(user.uid, { username: newUsername });
  }

  async initializeUserProfileSettings(userId: string): Promise<UserProfileSettings> {
    const defaultSettings: UserProfileSettings = {
      userId,
      theme: 'system',
      emailNotifications: true,
      pushNotifications: true,
      weeklyReport: false,
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(this.profilesCollection, userId), defaultSettings);
    return defaultSettings;
  }
}

export const profileService: ProfileService = new FirestoreProfileService();
