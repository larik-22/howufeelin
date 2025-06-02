import { Button, Box, Alert, Typography, CircularProgress } from '@mui/material';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';
import { LibraryMusic, Logout } from '@mui/icons-material';

export const SpotifyAuthButton = () => {
  const { client, isConnecting, isAuthenticated, error, connectSpotify, logout } = useSpotify();

  if (isConnecting) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Setting up Spotify...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Spotify Error: {error}
        <Button size="small" onClick={connectSpotify} sx={{ mt: 1 }}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {client && isAuthenticated ? (
        <>
          <Typography variant="body2" color="success.main">
            ✓ Connected to Spotify
          </Typography>
          <Button variant="outlined" size="small" startIcon={<Logout />} onClick={logout}>
            Disconnect
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            {client ? 'Ready to connect' : 'Not connected'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<LibraryMusic />}
            onClick={connectSpotify}
            sx={{
              bgcolor: '#1DB954', // Spotify green
              '&:hover': {
                bgcolor: '#1ed760',
              },
            }}
          >
            Connect Spotify
          </Button>
        </>
      )}
    </Box>
  );
};
