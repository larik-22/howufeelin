import { Navigate } from 'react-router';
import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import { isRizel } from '@/utils/specialUsers';
import Loading from '@/components/ui/Loading';

interface RizelProtectedRouteProps {
  children: React.ReactNode;
}

export default function RizelProtectedRoute({ children }: RizelProtectedRouteProps) {
  const auth = useContext(AuthContext);

  // If auth is still loading, show loading screen
  if (auth?.loading) {
    return <Loading isFullscreen />;
  }

  // If not authenticated, redirect to login
  if (!auth?.firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if the user is Rizel
  const isRizelUser = isRizel(auth.firebaseUser.email);

  // If not Rizel, redirect to dashboard
  if (!isRizelUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
}
