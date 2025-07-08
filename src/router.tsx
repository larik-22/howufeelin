import { createBrowserRouter, redirect, LoaderFunctionArgs } from 'react-router';
import { lazy, Suspense } from 'react';
import RootLayout from '@/layouts/RootLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RizelProtectedRoute from '@/components/auth/RizelProtectedRoute';
import AuthRoute from '@/components/auth/AuthRoute';
import RootRedirect from '@/components/auth/RootRedirect';
import Loading from '@/components/ui/Loading';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import DashboardBaseLayout from '@/layouts/DashboardBaseLayout';

// Lazy load pages
const Authenticate = lazy(() =>
  import('@/pages/Authenticate').then(module => ({ default: module.default }))
);
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then(module => ({ default: module.default }))
);
const GroupDetail = lazy(() =>
  import('@/pages/GroupDetail').then(module => ({ default: module.default }))
);
const NotFound = lazy(() =>
  import('@/pages/NotFound').then(module => ({ default: module.default }))
);
const RizelPage = lazy(() =>
  import('@/pages/RizelPage').then(module => ({ default: module.default }))
);
const Analytics = lazy(() =>
  import('@/pages/Analytics').then(module => ({ default: module.default }))
);
const SpotifyCallback = lazy(() =>
  import('@/pages/SpotifyCallback').then(module => ({ default: module.SpotifyCallback }))
);

export function hydrateFallback() {
  return <Loading isFullscreen />;
}

// Group loader function - simplified since auth is handled by ProtectedRoute
async function groupLoader({ params }: LoaderFunctionArgs) {
  const { groupId } = params;

  if (!groupId) {
    return redirect('/404');
  }

  // Just return the groupId - the component will handle validation with auth context
  return { groupId };
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '/',
        element: <RootRedirect />,
      },
      {
        path: '/login',
        element: (
          <AuthRoute>
            <Suspense fallback={<Loading isFullscreen />}>
              <Authenticate isRegister={false} />
            </Suspense>
          </AuthRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <AuthRoute>
            <Suspense fallback={<Loading isFullscreen />}>
              <Authenticate isRegister={true} />
            </Suspense>
          </AuthRoute>
        ),
      },
      {
        path: '/spotify/callback',
        element: (
          <Suspense fallback={<Loading isFullscreen />}>
            <SpotifyCallback />
          </Suspense>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: '/404',
        element: (
          <Suspense fallback={<Loading isFullscreen />}>
            <NotFound />
          </Suspense>
        ),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardBaseLayout />,
            children: [
              {
                path: '/dashboard',
                element: (
                  <Suspense fallback={<Loading isFullscreen />}>
                    <Dashboard />
                  </Suspense>
                ),
              },
              {
                path: '/analytics',
                element: (
                  <Suspense fallback={<Loading isFullscreen />}>
                    <Analytics />
                  </Suspense>
                ),
              },
              {
                path: '/groups/:groupId',
                loader: groupLoader,
                element: (
                  <Suspense fallback={<Loading isFullscreen />}>
                    <GroupDetail />
                  </Suspense>
                ),
              },
              {
                path: '/rizel',
                element: (
                  <RizelProtectedRoute>
                    <Suspense fallback={<Loading isFullscreen />}>
                      <RizelPage />
                    </Suspense>
                  </RizelProtectedRoute>
                ),
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<Loading isFullscreen />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);
