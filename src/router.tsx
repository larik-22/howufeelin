import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';
import RootLayout from '@/layouts/RootLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import RootRedirect from '@/components/RootRedirect';
import Loading from '@/components/Loading';
// Lazy load pages
const Authenticate = lazy(() => import('@/pages/Authenticate').then(module => ({ default: module.default })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.default })));


export function hydrateFallback() {
    return <Loading isFullscreen />
}

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: '/',
                element: <RootRedirect />,
            },
            {
                path: '/login',
                element: (
                    <Suspense fallback={<Loading isFullscreen />}>
                        <Authenticate isRegister={false} />
                    </Suspense>
                ),
            },
            {
                path: '/register',
                element: (
                    <Suspense fallback={<Loading isFullscreen />}>
                        <Authenticate isRegister={true} />
                    </Suspense>
                ),
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: '/dashboard',
                        element: (
                            <Suspense fallback={<Loading isFullscreen />}>
                                <Dashboard />
                            </Suspense>
                        ),
                    },
                ],
            },
        ],
    },
]);
