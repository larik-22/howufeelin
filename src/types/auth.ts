import { User, UserCredential } from 'firebase/auth';
import { MyUser } from './MyUser';

export interface AuthState {
  firebaseUser: User | null;
  myUser: MyUser | null;
  loading: boolean;
  operationLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ result: UserCredential; userDoc: MyUser }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  clearError: () => void;
  linkEmailPassword: (password: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
}
