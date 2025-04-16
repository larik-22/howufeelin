import { User } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  loading: boolean;
  operationLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  clearError: () => void;
  linkEmailPassword: (password: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
}
