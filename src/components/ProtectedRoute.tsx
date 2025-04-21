import { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';

export default function ProtectedRoute() {
  const auth = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Only set loading to false when auth is explicitly null (not authenticated)
    // or when we have a user (authenticated)
    if (auth === null || auth?.firebaseUser) {
      setIsLoading(false);
    }
  }, [auth]);

  if (isLoading) {
    return <Loading />;
  }

  if (!auth?.firebaseUser) {
    // Save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
