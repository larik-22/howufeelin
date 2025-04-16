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
import { getAuth } from 'firebase/auth';

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
    // Get the current Firebase user to access photoURL
    const auth = getAuth();
    const firebaseUser = auth.currentUser;

    // Create user data with photoURL from Firebase user if available
    const userData = {
      ...user,
      photoURL: firebaseUser?.photoURL || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(this.usersCollection, user.userId), userData);
  }

  async updateUser(userId: string, data: Partial<MyUser>): Promise<void> {
    const userRef = doc(this.usersCollection, userId);

    // Get the current Firebase user to access photoURL if it's not provided in the update data
    const auth = getAuth();
    const firebaseUser = auth.currentUser;

    // If photoURL is not provided in the update data but is available in Firebase user, use it
    const photoURL = data.photoURL !== undefined ? data.photoURL : firebaseUser?.photoURL || null;

    const updateData = {
      ...data,
      photoURL,
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
