import { Outlet } from 'react-router';
import AuthProvider from '@/contexts/auth/authProvider';

export default function RootLayout() {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
} 