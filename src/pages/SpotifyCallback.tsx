import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

export const SpotifyCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in URL parameters
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');

    if (errorParam) {
      console.error('Spotify auth error:', errorParam);
      setError(`Spotify authentication failed: ${errorParam}`);

      // Redirect to login after showing error
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 3000);
      return;
    }

    // Check for required auth code
    const code = urlParams.get('code');
    if (!code) {
      console.error('No authorization code received from Spotify');
      setError('No authorization code received from Spotify');

      // Redirect to dashboard after showing error
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 3000);
      return;
    }

    // The Spotify SDK handles the callback automatically
    // We just need to redirect back to where the user came from or dashboard
    console.log('Spotify callback received, redirecting...');

    const timer = setTimeout(() => {
      // Redirect to dashboard (where the Spotify integration is typically used)
      navigate('/dashboard', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, location.search]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          px: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Redirecting you back...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress sx={{ color: '#1DB954' }} />
      <Typography variant="h6">Connecting to Spotify...</Typography>
      <Typography variant="body2" color="text.secondary">
        You'll be redirected shortly
      </Typography>
    </Box>
  );
};
