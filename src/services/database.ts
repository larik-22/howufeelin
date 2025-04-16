import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { MyUser } from '@/types/MyUser';

export interface DatabaseService {
  getUserById(userId: string): Promise<MyUser | null>;
  createUser(user: MyUser): Promise<void>;
  updateUser(userId: string, data: Partial<MyUser>): Promise<void>;
  isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
}

class FirestoreService implements DatabaseService {
  async getUserById(userId: string): Promise<MyUser | null> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? (userDoc.data() as MyUser) : null;
  }

  async createUser(user: MyUser): Promise<void> {
    const userDocRef = doc(db, 'users', user.userId);
    await setDoc(userDocRef, {
      ...user,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  async updateUser(userId: string, data: Partial<MyUser>): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }

  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return false;

    // If we have an excludeUserId, check if the found document belongs to that user
    if (excludeUserId) {
      const existingUser = querySnapshot.docs[0];
      return existingUser.id !== excludeUserId;
    }

    return true;
  }
}

export const databaseService: DatabaseService = new FirestoreService();
