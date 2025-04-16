import { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';

export default function ProtectedRoute() {
  const auth = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      setIsLoading(false);
    }
  }, [auth]);

  if (isLoading) {
    return <Loading />;
  }

  if (!auth?.firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
