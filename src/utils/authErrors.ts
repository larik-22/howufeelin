export interface FirebaseError {
  code: string;
  message: string;
  email?: string;
  credential?: Record<string, unknown>;
}

export class AuthError extends Error {
  constructor(message: string, public code: string, public originalError?: unknown) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'auth/invalid-credential': 'Email or password is incorrect',
  'auth/wrong-password': 'Email or password is incorrect',
  'auth/user-not-found': 'Email or password is incorrect',
  'auth/email-already-in-use': 'This email is already registered. Please try logging in instead.',
  'auth/weak-password': 'Password should be at least 6 characters long',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email but different sign-in method.',
  'auth/popup-closed-by-user': 'Sign in was cancelled',
  'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/requires-recent-login':
    'This operation requires recent authentication. Please sign out and sign in again.',
  'auth/credential-already-in-use':
    'This credential is already associated with a different user account.',
  'auth/provider-already-linked': 'This provider is already linked to your account.',
  'auth/no-such-provider': 'This provider is not linked to your account.',
};

export function createAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as FirebaseError;
    const message = AUTH_ERROR_MESSAGES[firebaseError.code] || firebaseError.message;
    return new AuthError(message, firebaseError.code, error);
  }

  if (error instanceof Error) {
    return new AuthError(error.message, 'unknown', error);
  }

  return new AuthError('An unexpected error occurred. Please try again.', 'unknown', error);
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isFirebaseError(error: unknown): error is FirebaseError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as FirebaseError).code === 'string'
  );
}
