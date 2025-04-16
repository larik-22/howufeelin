import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/firebase.ts';
import AuthContext from './authContext';
import { AuthContextType } from '@/types/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { MyUser } from '@/types/MyUser';
import { getAuthErrorMessage } from '@/utils/authErrors';

type AuthOperation<T> = () => Promise<T>;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleAuthOperation<T>(operation: AuthOperation<T>): Promise<T> {
    try {
      setLoading(true);
      setError(null);
      return await operation();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      throw err; // Re-throw to allow component to handle the error
    } finally {
      setLoading(false);
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    await handleAuthOperation(() => signInWithEmailAndPassword(auth, email, password));
  };

  const signInWithGoogle = async () => {
    await handleAuthOperation(async () => {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    });
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Validate input
    if (!email || !password || !username) {
      throw new Error('All fields are required');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    await handleAuthOperation(async () => {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const newUser: MyUser = {
        userId: firebaseUser.uid,
        username: username,
        email: email,
        displayName: username,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, newUser);
      return userCredential;
    });
  };

  const signOut = async () => {
    await handleAuthOperation(() => firebaseSignOut(auth));
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
