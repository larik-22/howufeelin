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

export interface UserService {
  getUserById(userId: string): Promise<MyUser | null>;
  createUser(user: MyUser): Promise<void>;
  updateUser(userId: string, data: Partial<MyUser>): Promise<void>;
  isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
}

class FirestoreUserService implements UserService {
  private usersCollection = collection(db, 'users');

  async getUserById(userId: string): Promise<MyUser | null> {
    const userDoc = await getDoc(doc(this.usersCollection, userId));
    return userDoc.exists() ? (userDoc.data() as MyUser) : null;
  }

  async createUser(user: MyUser): Promise<void> {
    await setDoc(doc(this.usersCollection, user.userId), user);
  }

  async updateUser(userId: string, data: Partial<MyUser>): Promise<void> {
    const userRef = doc(this.usersCollection, userId);
    await setDoc(userRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
  }

  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    const q = query(this.usersCollection, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return false;

    if (excludeUserId) {
      return querySnapshot.docs.some(doc => doc.id !== excludeUserId);
    }

    return true;
  }
}

export const userService: UserService = new FirestoreUserService();
