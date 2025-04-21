import { Navigate, useLocation } from 'react-router';
import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';
import { UserInfo } from 'firebase/auth';

export default function AuthRoute({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const location = useLocation();

  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // Show loading only when auth is not initialized
  if (!auth) {
    return <Loading />;
  }

  // If auth is initialized but still loading, show loading
  if (auth.loading) {
    return <Loading />;
  }

  // If user is authenticated and has a password provider, redirect to the original page or dashboard
  if (
    auth.firebaseUser &&
    auth.firebaseUser.providerData.some((provider: UserInfo) => provider.providerId === 'password')
  ) {
    return <Navigate to={from} replace />;
  }

  // If user is not authenticated or needs to set password, show the auth page
  return <>{children}</>;
}
