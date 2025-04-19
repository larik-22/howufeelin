import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/firebase';
import AuthContext from './authContext';
import { AuthContextType } from '@/types/MyAuth';
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

      // Check if user exists
      const existingUser = await userService.getUserById(result.user.uid);
      if (!existingUser) {
        // Create initial user with auto-generated username
        const newUser = await userService.createInitialUser(result.user);
        setMyUser(newUser);
        return { result, userDoc: newUser };
      }

      setMyUser(existingUser);
      return { result, userDoc: existingUser };
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    await handleAuthOperation(async () => {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(result.user.uid);
    });
  };

  const linkEmailPassword = async (password: string) => {
    if (!auth.currentUser) {
      throw new Error('No user is signed in');
    }

    const currentUser = auth.currentUser;

    await handleAuthOperation(async () => {
      try {
        console.log('Attempting to set password for existing user');

        // Update the password for the current user
        await updatePassword(currentUser, password);
        console.log('Successfully set password for user');

        // Update the user document in Firestore to reflect that the account now has a password
        console.log('Updating user document in Firestore');
        await userService.updateUser(currentUser.uid, {
          updatedAt: Timestamp.now(),
        });
        console.log('Successfully updated user document');
      } catch (error) {
        console.error('Error in linkEmailPassword:', error);
        throw error;
      }
    });
  };

  const signUp = async (email: string, password: string, username: string) => {
    await handleAuthOperation(async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create user with provided username
      const newUser = await userService.createInitialUser({
        ...userCredential.user,
        displayName: username,
      });

      // Update username after creation
      await userService.updateUser(newUser.userId, { username });

      setMyUser(newUser);
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
