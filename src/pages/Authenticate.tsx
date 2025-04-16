import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import { createAuthError } from '@/utils/authErrors';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');

  // Update isRegister state when URL changes
  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  if (!auth) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await auth.signUp(email, password, name);
      } else {
        await auth.signInWithEmail(email, password);
      }
    } catch (error) {
      const authError = createAuthError(error);
      setError(authError.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await auth.signInWithGoogle();
      setShowPasswordDialog(true);
      setDialogError('');
    } catch (error) {
      const authError = createAuthError(error);
      setError(authError.message);
    }
  };

  const handleLinkPassword = async () => {
    try {
      await auth.linkEmailPassword(linkPassword);
      setShowPasswordDialog(false);
      setLinkPassword('');
      setDialogError('');
    } catch (error) {
      const authError = createAuthError(error);
      setDialogError(authError.message);
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
            maxWidth: 420,
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

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
                  disabled={auth.operationLoading}
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
                disabled={auth.operationLoading}
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
                disabled={auth.operationLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                        disabled={auth.operationLoading}
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
                disabled={auth.operationLoading}
                sx={{
                  mt: 2,
                  fontWeight: 'bold',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                }}
              >
                {auth.operationLoading ? (
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
            onClick={handleGoogleSignIn}
            disabled={auth.operationLoading}
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
                disabled={auth.operationLoading}
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
        <DialogTitle>Set a Password</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            To enable email/password sign-in, please set a password for your account.
          </Typography>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <TextField
            label="Password"
            type="password"
            value={linkPassword}
            onChange={e => setLinkPassword(e.target.value)}
            fullWidth
            required
            disabled={auth.operationLoading}
            error={!!dialogError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)} disabled={auth.operationLoading}>
            Skip
          </Button>
          <Button
            onClick={handleLinkPassword}
            disabled={!linkPassword || auth.operationLoading}
            variant="contained"
          >
            {auth.operationLoading ? <CircularProgress size={24} /> : 'Set Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
