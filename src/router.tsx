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
import { GroupMemberRole } from '@/types/GroupMemberRole';

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

  // If groupId is undefined, redirect to 404
  if (!groupId) {
    return redirect('/404');
  }

  // Wait for auth state to be initialized
  // This is crucial for handling page refreshes
  if (auth.currentUser === null) {
    // Check if auth is still initializing
    return new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe(); // Stop listening after first change

        if (user) {
          // User is authenticated, proceed with group validation
          validateGroupAndMembership(groupId, user.uid).then(resolve);
        } else {
          // User is not authenticated, they will be redirected by ProtectedRoute
          resolve(null);
        }
      });
    });
  }

  // If we already have the current user, proceed with validation
  return validateGroupAndMembership(groupId, auth.currentUser.uid);
}

// Helper function to validate group and membership
async function validateGroupAndMembership(groupId: string, userId: string) {
  try {
    // First check if the group exists
    const group = await groupService.getGroupById(groupId, userId);

    if (!group) {
      // Group not found, redirect to 404
      return redirect('/404');
    }

    // Then check if the user is a member of the group and get full group data
    try {
      // This will throw an error if the user is not a member
      const groupDetailData = await groupService.getGroupDetailData(groupId, userId);

      // Check if user is banned
      if (groupDetailData.userRole === GroupMemberRole.BANNED) {
        console.warn(`User ${userId} is banned from group ${groupId}`);
        return redirect('/dashboard?error=banned');
      }

      // If we get here, the user is a member of the group
      return {
        group: groupDetailData.group,
        memberCount: groupDetailData.memberCount,
        members: groupDetailData.members,
        userRole: groupDetailData.userRole,
      };
    } catch (error) {
      // Check for specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);

      // User is not a member of the group, redirect to dashboard
      console.warn(
        `User ${userId} attempted to access group ${groupId} but is not a member: ${errorMessage}`
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
