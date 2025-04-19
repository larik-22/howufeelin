import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '@/theme';
import NotFound from '@/pages/NotFound';
import { useEffect } from 'react';

export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if it's a route error response
    if (isRouteErrorResponse(error)) {
      // If it's a 404 error, redirect to the 404 page
      if (error.status === 404) {
        navigate('/404', { replace: true });
        return;
      }

      // Check for specific error messages in the data
      const errorMessage = error.data?.message || '';

      // If the error message indicates the user is banned, redirect to dashboard
      if (errorMessage.includes('banned') || errorMessage === 'User is banned from this group') {
        navigate('/dashboard?error=banned', { replace: true });
        return;
      }

      // If the error message indicates the user is not a member, redirect to dashboard
      if (errorMessage.includes('not a member')) {
        navigate('/dashboard?error=not_member', { replace: true });
        return;
      }
    }

    // For other errors, check if it's a string error that might contain banned information
    if (typeof error === 'string' && error.includes('banned')) {
      navigate('/dashboard?error=banned', { replace: true });
      return;
    }

    // For other errors, check if it's an Error object that might contain banned information
    if (error instanceof Error && error.message.includes('banned')) {
      navigate('/dashboard?error=banned', { replace: true });
      return;
    }
  }, [error, navigate]);

  // For non-404 errors, render the NotFound component directly
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotFound />
    </ThemeProvider>
  );
}
