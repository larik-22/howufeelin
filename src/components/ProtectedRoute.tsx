import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';

export default function ProtectedRoute() {
  const auth = useContext(AuthContext);
  const location = useLocation();

  // Show loading only when auth is not initialized
  if (!auth) {
    return <Loading isFullscreen />;
  }

  // If auth is initialized but still loading, show loading
  if (auth.loading) {
    return <Loading isFullscreen />;
  }

  // If no user, redirect to login
  if (!auth.firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, show protected content
  return <Outlet />;
}
