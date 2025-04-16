import { Navigate } from 'react-router';
import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';

export default function AuthRoute({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);

  // Show loading only when auth is not initialized
  if (!auth) {
    return <Loading />;
  }

  // If auth is initialized but still loading, show loading
  if (auth.loading) {
    return <Loading />;
  }

  // If user is authenticated and has a password provider, redirect to dashboard
  if (
    auth.firebaseUser &&
    auth.firebaseUser.providerData.some(provider => provider.providerId === 'password')
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not authenticated or needs to set password, show the auth page
  return <>{children}</>;
}
