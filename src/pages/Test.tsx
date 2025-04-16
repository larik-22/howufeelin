import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import { useNavigate } from 'react-router';
import { Box, Typography, Button, Paper } from '@mui/material';

export default function Test() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  if (!auth || !auth.firebaseUser) return null;

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 1, py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background:
            'linear-gradient(to right, rgba(143, 197, 163, 0.1), rgba(143, 197, 163, 0.05))',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 500,
            mb: 1,
            color: 'text.primary',
          }}
        >
          Test Page
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: '1.1rem',
            lineHeight: 1.5,
          }}
        >
          This is a test page to verify the layout structure
        </Typography>
      </Paper>

      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
