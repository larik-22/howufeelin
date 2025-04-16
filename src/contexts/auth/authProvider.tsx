import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { auth, db } from '@/firebase.ts';
import AuthContext from './authContext';
import { AuthContextType } from '@/types/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { MyUser } from '@/types/MyUser';
import { createAuthError } from '@/utils/authErrors';

type AuthOperation<T> = () => Promise<T>;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true); // Initial auth state loading
  const [operationLoading, setOperationLoading] = useState(false); // Loading for auth operations
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
      setOperationLoading(true);
      setError(null);
      return await operation();
    } catch (err) {
      const authError = createAuthError(err);
      setError(authError.message);
      throw err; // Re-throw to allow component to handle the error
    } finally {
      setOperationLoading(false);
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    await handleAuthOperation(() => signInWithEmailAndPassword(auth, email, password));
  };

  const createUserDocument = async (firebaseUser: FirebaseUser, username?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    // Only create document if it doesn't exist
    if (!userDoc.exists()) {
      const newUser: MyUser = {
        userId: firebaseUser.uid,
        username:
          username || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        displayName:
          username || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(userDocRef, newUser);
    }
  };

  const linkEmailPassword = async (password: string) => {
    if (!auth.currentUser?.email) {
      throw new Error('No email available for linking');
    }

    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);

    await handleAuthOperation(async () => {
      await linkWithCredential(auth.currentUser!, credential);
    });
  };

  const signInWithGoogle = async () => {
    await handleAuthOperation(async () => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      return result;
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
      await createUserDocument(userCredential.user, username);
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
    operationLoading,
    error,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    clearError,
    linkEmailPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
