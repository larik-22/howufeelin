import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { Box, Tabs, Tab, Snackbar, Alert, Skeleton, Card, CardContent } from '@mui/material';
import dayjs from 'dayjs';

import AuthContext from '@/contexts/auth/authContext';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';
import { copyToClipboard } from '@/utils/clipboard';

import { GroupHeader } from '@/components/group/GroupHeader';
import { GroupDetails } from '@/components/group/GroupDetails';
import { MoodInput } from '@/components/mood/MoodInput';
import { MoodCalendar } from '@/components/mood/MoodCalendar';
import { GroupMembers } from '@/components/group/GroupMembers';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

// Mock data for user ratings - this would come from your backend
const mockUserRatings = [
  // April 14, 2025
  { userId: 'user1', username: 'John', rating: 8, date: '2025-04-14' },
  { userId: 'user2', username: 'Jane', rating: 6, date: '2025-04-14' },
  { userId: 'user3', username: 'Bob', rating: 9, date: '2025-04-14' },
  { userId: 'user4', username: 'Alice', rating: 7, date: '2025-04-14' },
  { userId: 'user5', username: 'Charlie', rating: 5, date: '2025-04-14' },

  // April 15, 2025
  { userId: 'user1', username: 'John', rating: 7, date: '2025-04-15' },
  { userId: 'user2', username: 'Jane', rating: 8, date: '2025-04-15' },
  { userId: 'user3', username: 'Bob', rating: 5, date: '2025-04-15' },
  { userId: 'user4', username: 'Alice', rating: 9, date: '2025-04-15' },
  { userId: 'user5', username: 'Charlie', rating: 6, date: '2025-04-15' },

  // April 16, 2025 (today)
  { userId: 'user1', username: 'John', rating: 9, date: '2025-04-16' },
  { userId: 'user2', username: 'Jane', rating: 7, date: '2025-04-16' },
  { userId: 'user3', username: 'Bob', rating: 8, date: '2025-04-16' },
  { userId: 'user4', username: 'Alice', rating: 6, date: '2025-04-16' },
  // Charlie hasn't submitted a rating for today yet
];

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { getRoleColor, getRoleLabel } = useGroupPermissions();

  // Get the group data from the loader
  const { group: loaderGroup } = useLoaderData() as { group: Group };

  const [group, setGroup] = useState<Group | null>(loaderGroup || null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs('2025-04-16'));
  const [activeTab, setActiveTab] = useState<number>(0);
  const [hasRatedToday, setHasRatedToday] = useState<boolean>(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId || !auth?.myUser?.userId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch member count and group members in a single batch
        const [count, members] = await Promise.all([
          groupService.getGroupMemberCount(groupId),
          groupService.getGroupMembers(groupId),
        ]);

        // Fetch user's role in this group
        const userGroups = await groupService.getUserGroups(auth.myUser.userId);
        const userGroup = userGroups.find(g => g.groupId === groupId);

        if (!userGroup) {
          setError('You are not a member of this group');
          setLoading(false);
          return;
        }

        // Set group data with user role
        setGroup({
          ...loaderGroup,
          userRole: userGroup.userRole,
        });
        setMemberCount(count);
        setGroupMembers(members);

        // Check if user has already rated today
        const today = dayjs().format('YYYY-MM-DD');
        const userRating = mockUserRatings.find(
          rating => rating.userId === auth.myUser?.userId && rating.date === today
        );
        setHasRatedToday(!!userRating);
      } catch (err) {
        console.error('Error fetching group data:', err);
        setError('Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, auth?.myUser?.userId, loaderGroup]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleCopyJoinCode = async (joinCode: string) => {
    try {
      await copyToClipboard(joinCode);
      setCopiedCode(joinCode);
      setNotification({
        message: 'Join code copied to clipboard!',
        type: 'success',
      });
    } catch {
      setNotification({
        message: 'Failed to copy join code',
        type: 'error',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !auth?.myUser?.userId) return;

    try {
      setLoading(true);
      await groupService.removeMemberFromGroup(groupId, auth.myUser.userId);
      setNotification({
        message: 'You have left the group',
        type: 'info',
      });
      setTimeout(() => {
        navigate('/groups');
      }, 1500);
    } catch {
      setNotification({
        message: 'Failed to leave the group',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMoodSubmit = async (rating: number, note: string) => {
    // This would be implemented to save the mood rating to the backend
    console.log('Submitting mood:', { rating, note });
    setHasRatedToday(true);
    setNotification({
      message: 'Mood rating submitted successfully!',
      type: 'success',
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* Header Skeleton */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative', width: '100%' }}
        >
          <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto' }} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>

        {/* Group Details Skeleton */}
        <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                <Skeleton variant="text" width={150} height={30} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
            </Box>
            <Skeleton variant="rectangular" width="100%" height={1} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" height={60} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={100} height={20} />
              <Box sx={{ display: 'flex', ml: 2 }}>
                <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
                <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
                <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
                <Skeleton variant="circular" width={30} height={30} />
              </Box>
            </Box>
            <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>

        {/* Tabs Skeleton */}
        <Box sx={{ display: 'flex', mb: 3 }}>
          <Skeleton variant="rectangular" width={120} height={48} sx={{ mr: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={120} height={48} sx={{ mr: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={120} height={48} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Content Skeleton */}
        <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
          <CardContent>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ borderRadius: 2, mb: 2 }}
            />
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {group && (
        <>
          <GroupHeader
            group={group}
            onBack={handleBackToDashboard}
            onLeave={handleLeaveGroup}
            currentUserId={auth?.myUser?.userId}
          />

          <GroupDetails
            group={group}
            memberCount={memberCount}
            onCopyJoinCode={handleCopyJoinCode}
            copiedCode={copiedCode}
            getRoleLabel={getRoleLabel}
            getRoleColor={getRoleColor}
            loading={loading}
            groupMembers={groupMembers}
          />

          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Today's Moods" />
            <Tab label="Calendar" />
            <Tab label="Members" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              {!hasRatedToday && (
                <MoodInput onSubmit={handleMoodSubmit} hasRatedToday={hasRatedToday} />
              )}
              <MoodCalendar
                ratings={mockUserRatings}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </Box>
          )}

          {activeTab === 1 && (
            <MoodCalendar
              ratings={mockUserRatings}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          )}

          {activeTab === 2 && (
            <GroupMembers
              members={groupMembers.map(member => ({
                name: member.displayName,
                role: member.role,
                userId: member.userId,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  member.displayName
                )}&background=random`,
                photoURL: member.photoURL || null,
              }))}
              getRoleLabel={getRoleLabel}
              getRoleColor={getRoleColor}
              loading={loading}
            />
          )}
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
