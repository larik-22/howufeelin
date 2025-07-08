import {
  Button,
  Box,
  Alert,
  Typography,
  CircularProgress,
  Fade,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';
import { LibraryMusic, Logout, CheckCircle } from '@mui/icons-material';

export const SpotifyAuthButton = () => {
  const theme = useTheme();
  const { client, isConnecting, isAuthenticated, error, connectSpotify, logout } = useSpotify();

  if (isConnecting) {
    return (
      <Fade in timeout={300}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <CircularProgress
            size={24}
            sx={{
              color: 'primary.main',
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            Setting up Spotify...
          </Typography>
        </Box>
      </Fade>
    );
  }

  if (error) {
    return (
      <Slide direction="down" in timeout={400}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Spotify Connection Error
          </Typography>
          <Typography variant="caption" sx={{ mb: 2, display: 'block', opacity: 0.8 }}>
            {error}
          </Typography>
          <Button
            size="small"
            onClick={connectSpotify}
            variant="outlined"
            sx={{
              mt: 1,
              borderRadius: 1.5,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            Try Again
          </Button>
        </Alert>
      </Slide>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {client && isAuthenticated ? (
        <Fade in timeout={500}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              }}
            >
              <CheckCircle sx={{ color: 'success.main', fontSize: '1.2rem' }} />
              <Typography
                variant="body2"
                sx={{
                  color: 'success.main',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                Connected to Spotify
              </Typography>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Logout />}
              onClick={logout}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                px: 2.5,
                py: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  borderColor: 'error.main',
                  color: 'error.main',
                  transform: 'scale(1.02)',
                },
              }}
            >
              Disconnect
            </Button>
          </Box>
        </Fade>
      ) : (
        <Slide direction="up" in timeout={400}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                textAlign: 'center',
                opacity: 0.8,
              }}
            >
              {client ? 'Ready to connect to your music' : 'Connect to access your music library'}
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<LibraryMusic />}
              onClick={connectSpotify}
              sx={{
                bgcolor: '#1DB954', // Spotify green
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: '#1ed760',
                  transform: 'translateY(-2px)',
                  boxShadow: 6,
                },
                '&:active': {
                  transform: 'translateY(0px)',
                  boxShadow: 2,
                },
              }}
            >
              Connect Spotify
            </Button>
          </Box>
        </Slide>
      )}
    </Box>
  );
};
