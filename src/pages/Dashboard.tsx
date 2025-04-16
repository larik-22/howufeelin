import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import { useNavigate } from 'react-router';
import DashboardBaseLayout from '@/layouts/DashboardBaseLayout';
import { Button, Typography } from '@mui/material';

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth || !auth.firebaseUser) return null;

  return (
    <DashboardBaseLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome, {auth.myUser?.displayName}
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/test')}>
        Test
      </Button>
    </DashboardBaseLayout>
  );
}
