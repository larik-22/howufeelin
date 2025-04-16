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
    // If it's a 404 error, redirect to the 404 page
    if (isRouteErrorResponse(error) && error.status === 404) {
      navigate('/404', { replace: true });
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
