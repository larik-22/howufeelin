import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
  User,
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/firebase';
import AuthContext from './authContext';
import { AuthContextType } from '@/types/MyAuth';
import { MyUser } from '@/types/MyUser';
import { createAuthError, AuthError } from '@/utils/authErrors';
import { userService } from '@/services/userService';
import { simulateSpecialUser } from '@/utils/specialUsers';
import { analyticsService } from '@/services/analyticsService';

// Create a wrapper for the user object to allow email modification in development
const createUserWrapper = (user: User | null): User | null => {
  if (!user || process.env.NODE_ENV !== 'development') return user;

  return {
    ...user,
    email: simulateSpecialUser(user.email || ''),
  } as User;
};

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
      const wrappedUser = createUserWrapper(user);
      setUser(wrappedUser);
      if (wrappedUser) {
        if (!myUser) {
          await fetchUserData(wrappedUser.uid);
        }
        // Track user return
        const lastVisit = localStorage.getItem('lastVisit');
        if (lastVisit) {
          const daysSinceLastVisit = Math.floor(
            (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)
          );
          analyticsService.trackUserReturn(daysSinceLastVisit);
        }
        localStorage.setItem('lastVisit', Date.now().toString());
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
        analyticsService.trackUserSignup('google');
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

        // Force a refresh of the auth state to ensure the provider data is updated
        await currentUser.reload();
        console.log('Auth state refreshed after password linking');

        // Update the local user state to reflect the changes
        setUser(createUserWrapper(auth.currentUser));
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
      const newUser = await userService.createInitialUser(
        {
          ...userCredential.user,
          displayName: username,
        },
        username
      );

      setMyUser(newUser);
      analyticsService.trackUserSignup('email');
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
