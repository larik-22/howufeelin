export interface FirebaseError {
  code: string;
  message: string;
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
};

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as FirebaseError;
    if (firebaseError.code && AUTH_ERROR_MESSAGES[firebaseError.code]) {
      return AUTH_ERROR_MESSAGES[firebaseError.code];
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
