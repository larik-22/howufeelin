import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Outlet } from 'react-router';
import { useContext } from 'react';
import AuthProvider from '@/contexts/auth/authProvider';
import { createAppTheme } from '@/theme';
import BaseLayout from './BaseLayout';
import AuthContext from '@/contexts/auth/authContext';

function ThemedApp() {
  const auth = useContext(AuthContext);
  const theme = createAppTheme(auth?.firebaseUser?.email);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BaseLayout>
        <Outlet />
      </BaseLayout>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemedApp />
    </AuthProvider>
  );
}
