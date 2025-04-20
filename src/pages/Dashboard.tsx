import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import { Typography, Box, Paper, Alert, Snackbar, useTheme, useMediaQuery } from '@mui/material';
import Groups from './Groups';

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');

    if (error === 'not_member') {
      setNotification({
        message: 'You are not a member of this group',
        severity: 'error',
      });
    } else if (error === 'banned') {
      setNotification({
        message: 'You have been banned from this group',
        severity: 'error',
      });
    }
  }, [location.search]);

  const handleCloseNotification = () => {
    setNotification(null);
  };

  if (!auth || !auth.firebaseUser) return null;

  return (
    <Box
      sx={{
        maxWidth: 'lg',
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 4 },
          mb: { xs: 5, sm: 3, md: 4 },
          backgroundColor: 'background.main',
          borderRadius: 2,
        }}
      >
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          component="h1"
          sx={{
            fontWeight: 500,
            mb: 1,
            color: 'text.primary',
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          Welcome back, {auth.myUser?.displayName}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1.1rem' },
            lineHeight: 1.5,
          }}
        >
          Here's an overview of your groups
        </Typography>
      </Paper>

      <Groups />

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
