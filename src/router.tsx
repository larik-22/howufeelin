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
import { getAuth } from 'firebase/auth';

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

// Group loader function to validate group existence and user membership
async function groupLoader({ params }: LoaderFunctionArgs) {
  const groupId = params.groupId;
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // If groupId is undefined, redirect to 404
  if (!groupId) {
    return redirect('/404');
  }

  // If user is not authenticated, they will be redirected by ProtectedRoute
  if (!currentUser) {
    return null;
  }

  try {
    // First check if the group exists
    const group = await groupService.getGroupById(groupId, currentUser.uid);

    if (!group) {
      // Group not found, redirect to 404
      return redirect('/404');
    }

    // Then check if the user is a member of the group and get full group data
    try {
      // This will throw an error if the user is not a member
      const groupDetailData = await groupService.getGroupDetailData(groupId, currentUser.uid);

      // If we get here, the user is a member of the group
      return {
        group: groupDetailData.group,
        memberCount: groupDetailData.memberCount,
        members: groupDetailData.members,
        userRole: groupDetailData.userRole,
      };
    } catch (error) {
      // User is not a member of the group, redirect to dashboard
      console.warn(
        `User ${currentUser.uid} attempted to access group ${groupId} but is not a member: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return redirect('/dashboard?error=not_member');
    }
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
