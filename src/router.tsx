import { createBrowserRouter, redirect, LoaderFunctionArgs } from 'react-router';
import { lazy, Suspense } from 'react';
import RootLayout from '@/layouts/RootLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthRoute from '@/components/AuthRoute';
import RootRedirect from '@/components/RootRedirect';
import Loading from '@/components/Loading';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardBaseLayout from '@/layouts/DashboardBaseLayout';
import { groupService } from '@/services/groupService';

// Lazy load pages
const Authenticate = lazy(() =>
  import('@/pages/Authenticate').then(module => ({ default: module.default }))
);
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then(module => ({ default: module.default }))
);
const Test = lazy(() => import('@/pages/Test').then(module => ({ default: module.default })));
const GroupDetail = lazy(() =>
  import('@/pages/GroupDetail').then(module => ({ default: module.default }))
);
const NotFound = lazy(() =>
  import('@/pages/NotFound').then(module => ({ default: module.default }))
);

export function hydrateFallback() {
  return <Loading isFullscreen />;
}

// Group loader function to validate group existence
async function groupLoader({ params }: LoaderFunctionArgs) {
  const groupId = params.groupId;

  // If groupId is undefined, redirect to 404
  if (!groupId) {
    return redirect('/404');
  }

  try {
    const group = await groupService.getGroupById(groupId);

    if (!group) {
      // Group not found, redirect to 404
      return redirect('/404');
    }

    return { group };
  } catch (error) {
    console.error('Error loading group:', error);
    return redirect('/404');
  }
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
                path: '/groups/:groupId',
                loader: groupLoader,
                element: (
                  <Suspense fallback={<Loading isFullscreen />}>
                    <GroupDetail />
                  </Suspense>
                ),
              },
              {
                path: '/test',
                element: (
                  <Suspense fallback={<Loading isFullscreen />}>
                    <Test />
                  </Suspense>
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
