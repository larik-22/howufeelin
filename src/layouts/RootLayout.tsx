import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Outlet } from 'react-router';
import AuthProvider from '@/contexts/auth/authProvider';
import { theme } from '@/theme';
import BaseLayout from './BaseLayout';

export default function RootLayout() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BaseLayout>
                    <Outlet />
                </BaseLayout>
            </AuthProvider>
        </ThemeProvider>
    );
} 