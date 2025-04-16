import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface AuthenticateProps {
  isRegister?: boolean;
}

export default function Authenticate({ isRegister: initialIsRegister = false }: AuthenticateProps) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [name, setName] = useState('');

  // Update isRegister state when URL changes
  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  if (!auth) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      await auth.signUp(email, password, name);
    } else {
      await auth.signInWithEmail(email, password);
    }
  };

  const handleToggleMode = () => {
    const newPath = isRegister ? '/login' : '/register';
    navigate(newPath);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h4" component="h1" align="center">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 1 }}>
            {isRegister ? 'Sign up to get started' : 'Sign in to continue'}
          </Typography>

          {auth.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {auth.error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {isRegister && (
                <TextField
                  label="Username"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  autoComplete="name"
                />
              )}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                fullWidth
                variant="outlined"
                autoComplete="email"
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                fullWidth
                variant="outlined"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="outlined"
                size="large"
                disabled={auth.loading}
                sx={{
                  mt: 2,
                  fontWeight: 'bold',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                }}
              >
                {auth.loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isRegister ? (
                  'Sign Up'
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>
          </form>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon sx={{ color: 'white' }} />}
            onClick={auth.signInWithGoogle}
            disabled={auth.loading}
            sx={{
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {isRegister ? 'Sign up with Google' : 'Sign in with Google'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link
                component="button"
                variant="body2"
                onClick={handleToggleMode}
                sx={{ fontWeight: 'bold' }}
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
