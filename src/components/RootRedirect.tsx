import { useContext } from 'react';
import { Navigate } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';

export default function RootRedirect() {
  const auth = useContext(AuthContext);

  // Show loading only when auth is not initialized
  if (!auth) {
    return <Loading />;
  }

  // If auth is initialized but still loading, show loading
  if (auth.loading) {
    return <Loading />;
  }

  // If user is authenticated, redirect to dashboard
  if (auth.firebaseUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not authenticated, redirect to login
  return <Navigate to="/login" replace />;
}
