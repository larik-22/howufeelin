import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';
import RootLayout from '@/layouts/RootLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load pages
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.default })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.default })));
const Home = lazy(() => import('@/pages/Home').then(module => ({ default: module.default })));

// Loading component
const Loading = () => <div>Loading...</div>;

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: '/',
                element: (
                    <Suspense fallback={<Loading />}>
                        <Home />
                    </Suspense>
                ),
            },
            {
                path: '/login',
                element: (
                    <Suspense fallback={<Loading />}>
                        <Login />
                    </Suspense>
                ),
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: '/dashboard',
                        element: (
                            <Suspense fallback={<Loading />}>
                                <Dashboard />
                            </Suspense>
                        ),
                    },
                ],
            },
        ],
    },
]);
