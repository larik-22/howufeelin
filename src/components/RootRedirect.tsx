import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import Loading from './Loading';
export default function RootRedirect() {
    const auth = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (auth) {
            setIsLoading(false);
        }
    }, [auth]);

    if (isLoading) {
        return <Loading />;
    }

    // If user is authenticated, redirect to dashboard
    if (auth?.user) {
        return <Navigate to="/dashboard" replace />;
    }

    // If user is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
} 