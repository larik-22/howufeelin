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
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/firebase';
import AuthContext from './authContext';
import { AuthContextType } from '@/types/Auth';
import { MyUser } from '@/types/MyUser';
import { createAuthError, AuthError } from '@/utils/authErrors';
import { userService } from '@/services/userService';

type AuthOperation<T> = () => Promise<T>;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['firebaseUser']>(null);
  const [myUser, setMyUser] = useState<MyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (userId: string) => {
    const userData = await userService.getUserById(userId);
    if (userData) {
      setMyUser(userData);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setUser(user);
      if (user) {
        if (!myUser) {
          await fetchUserData(user.uid);
        }
      } else {
        setMyUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [myUser]);

  async function handleAuthOperation<T>(operation: AuthOperation<T>): Promise<T> {
    try {
      setOperationLoading(true);
      setError(null);
      return await operation();
    } catch (err) {
      const authError = createAuthError(err);
      setError(authError.message);
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }

  const signInWithGoogle = async () => {
    return await handleAuthOperation(async () => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userDoc = await createUserDocument(result.user);
      setMyUser(userDoc);
      return { result, userDoc };
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    await handleAuthOperation(async () => {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(result.user.uid);
    });
  };

  const createUserDocument = async (firebaseUser: FirebaseUser, username?: string) => {
    const existingUser = await userService.getUserById(firebaseUser.uid);

    if (!existingUser) {
      const newUser: MyUser = {
        userId: firebaseUser.uid,
        username: username || '',
        email: firebaseUser.email || '',
        displayName:
          username || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await userService.createUser(newUser);
      return newUser;
    }
    return existingUser;
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

  const signUp = async (email: string, password: string, username: string) => {
    await handleAuthOperation(async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userDoc = await createUserDocument(userCredential.user, username);
      setMyUser(userDoc);
      return userCredential;
    });
  };

  const signOut = async () => {
    await handleAuthOperation(() => {
      setMyUser(null);
      return firebaseSignOut(auth);
    });
  };

  const updateUsername = async (username: string) => {
    if (!auth.currentUser) {
      throw new Error('No user is signed in');
    }

    await handleAuthOperation(async () => {
      const isTaken = await userService.isUsernameTaken(username, auth.currentUser!.uid);
      if (isTaken) {
        throw new AuthError('Username is already taken', 'username/taken');
      }

      await userService.updateUser(auth.currentUser!.uid, {
        username,
        displayName: username,
      });

      const updatedUser = await userService.getUserById(auth.currentUser!.uid);
      if (updatedUser) {
        setMyUser(updatedUser);
      }
    });
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    firebaseUser: user,
    myUser,
    loading,
    operationLoading,
    error,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    clearError,
    linkEmailPassword,
    updateUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
