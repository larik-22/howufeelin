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
  createInitialUser(firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }): Promise<MyUser>;
}

class FirestoreUserService implements UserService {
  private usersCollection = collection(db, 'users');

  async getUserById(userId: string): Promise<MyUser | null> {
    const userDoc = await getDoc(doc(this.usersCollection, userId));
    return userDoc.exists() ? (userDoc.data() as MyUser) : null;
  }

  async createInitialUser(firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }): Promise<MyUser> {
    const now = Timestamp.now();
    const initialUsername = `user_${firebaseUser.uid.substring(0, 8)}`;

    const initialUser: MyUser = {
      userId: firebaseUser.uid,
      username: initialUsername,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || initialUsername,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await this.createUser(initialUser);
    return initialUser;
  }

  async createUser(user: MyUser): Promise<void> {
    const userData = {
      ...user,
      createdAt: user.createdAt || Timestamp.now(),
      updatedAt: user.updatedAt || Timestamp.now(),
    };

    await setDoc(doc(this.usersCollection, user.userId), userData);
  }

  async updateUser(userId: string, data: Partial<MyUser>): Promise<void> {
    const userRef = doc(this.usersCollection, userId);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await setDoc(userRef, updateData, { merge: true });
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
