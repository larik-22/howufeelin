import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Box, CircularProgress, Typography } from '@mui/material';

export const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The Spotify SDK handles the callback automatically
    // We just need to redirect back to the main page
    // The SDK will process the auth code in the background

    const timer = setTimeout(() => {
      navigate('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
      <CircularProgress />
      <Typography variant="h6">Connecting to Spotify...</Typography>
    </Box>
  );
};
