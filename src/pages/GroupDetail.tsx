import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { Box, Tabs, Tab, Snackbar, Alert, Skeleton, Card, CardContent } from '@mui/material';
import dayjs from 'dayjs';

import AuthContext from '@/contexts/auth/authContext';
import { groupService } from '@/services/groupService';
import { ratingService, RatingError } from '@/services/ratingService';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { Rating } from '@/types/Rating';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';
import { copyToClipboard } from '@/utils/clipboard';

import { GroupHeader } from '@/components/group/GroupHeader';
import { GroupDetails } from '@/components/group/GroupDetails';
import { MoodInput } from '@/components/mood/MoodInput';
import { MoodCalendar } from '@/components/mood/MoodCalendar';
import { GroupMembers } from '@/components/group/GroupMembers';
import { RatingList } from '@/components/mood/RatingList';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

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
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState<number>(0);
  const [hasRatedToday, setHasRatedToday] = useState<boolean>(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [todayRatings, setTodayRatings] = useState<Rating[]>([]);
  const [calendarRatings, setCalendarRatings] = useState<Rating[]>([]);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId || !auth?.myUser?.userId) return;
      if (!auth.myUser) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel using Promise.all
        const [groupData, ratingData] = await Promise.all([
          groupService.getGroupDetailData(groupId, auth.myUser.userId),
          ratingService.getGroupDetailRatings(groupId, auth.myUser.userId),
        ]);

        // Update all state at once to minimize re-renders
        setGroup({
          ...groupData.group,
          userRole: groupData.userRole,
        });
        setMemberCount(groupData.memberCount);
        setGroupMembers(groupData.members);
        setHasRatedToday(ratingData.hasRatedToday);
        setTodayRatings(ratingData.todayRatings);
        setCalendarRatings(ratingData.calendarRatings);
      } catch (err) {
        console.error('Error fetching group data:', err);
        setError(`Failed to load group data: ${err instanceof Error ? err.message : String(err)}`);
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

  // TODO: Fix this (example logic for now, no timeouts should be used)
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
    if (!groupId || !auth?.myUser?.userId) return;

    try {
      setLoading(true);

      // Create the rating
      const newRating = await ratingService.createRating(groupId, auth.myUser.userId, rating, note);

      // Update the UI - add to both today's ratings and calendar ratings
      setTodayRatings(prev => [newRating, ...prev]);
      setCalendarRatings(prev => [newRating, ...prev]);
      setHasRatedToday(true);

      setNotification({
        message: 'Mood rating submitted successfully!',
        type: 'success',
      });
    } catch (error: unknown) {
      console.error('Error submitting mood rating:', error);

      let errorMessage = 'Failed to submit mood rating';
      let errorType: 'error' | 'info' = 'error';

      if (error instanceof RatingError) {
        switch (error.code) {
          case 'ALREADY_RATED':
            errorMessage = 'You have already rated your mood today';
            errorType = 'info';
            setHasRatedToday(true);
            break;
          case 'INVALID_RATING':
            errorMessage = 'Please provide a valid rating between 1 and 10';
            break;
          case 'INVALID_NOTES':
            errorMessage = 'Notes must be less than 500 characters';
            break;
          default:
            errorMessage = error.message;
        }
      }

      setNotification({
        message: errorMessage,
        type: errorType,
      });
    } finally {
      setLoading(false);
    }
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
              <MoodInput onSubmit={handleMoodSubmit} hasRatedToday={hasRatedToday} />

              {/* Display today's ratings using the RatingList component */}
              <RatingList
                ratings={todayRatings}
                groupMembers={groupMembers}
                title="Today's Moods"
              />
            </Box>
          )}

          {activeTab === 1 && (
            <MoodCalendar
              ratings={calendarRatings.map(rating => ({
                userId: rating.userId,
                username:
                  groupMembers.find(m => m.userId === rating.userId)?.displayName || 'Unknown',
                rating: rating.ratingNumber,
                date: rating.ratingDate,
              }))}
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
