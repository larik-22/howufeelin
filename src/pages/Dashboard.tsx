import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import { Typography, Box, Paper, Button } from '@mui/material';
import Groups from './Groups';
import { useNavigate } from 'react-router';

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

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
          Welcome back, {auth.myUser?.displayName}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: '1.1rem',
            lineHeight: 1.5,
          }}
        >
          Here's an overview of your groups
        </Typography>
      </Paper>

      <Groups />
      <Button onClick={() => navigate('/test')}>Go to test</Button>
    </Box>
  );
}
