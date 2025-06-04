import { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Alert, Snackbar, Box } from '@mui/material';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';

export default function RootRedirect() {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'error' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const groupParam = params.get('group');

    if (error === 'not_member') {
      const groupName = groupParam ? decodeURIComponent(groupParam) : 'this group';
      setNotification({
        message: `You are not a member of ${groupName}`,
        severity: 'error',
      });
    } else if (error === 'banned') {
      const groupName = groupParam ? decodeURIComponent(groupParam) : 'this group';
      setNotification({
        message: `You have been banned from ${groupName}`,
        severity: 'error',
      });
    } else if (error === 'timeout') {
      setNotification({
        message: 'Request timed out. Please try again.',
        severity: 'warning',
      });
    }
  }, [location.search]);

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Show loading only when auth is not initialized
  if (!auth) {
    return <Loading />;
  }

  // If auth is initialized but still loading, show loading
  if (auth.loading) {
    return <Loading />;
  }

  // Show notification if there are errors
  if (notification) {
    return (
      <Box>
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Continue with normal redirect after showing notification */}
        {auth.firebaseUser ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Navigate to="/login" replace />
        )}
      </Box>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (auth.firebaseUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not authenticated, redirect to login
  return <Navigate to="/login" replace />;
}
