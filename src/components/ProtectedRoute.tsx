import { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';

export default function ProtectedRoute() {
    const auth = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (auth) {
            setIsLoading(false);
        }
    }, [auth]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!auth?.user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
} 