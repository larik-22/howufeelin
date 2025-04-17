import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import {
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Skeleton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import dayjs from 'dayjs';

import AuthContext from '@/contexts/auth/authContext';
import { groupService } from '@/services/groupService';
import { ratingService, RatingError } from '@/services/ratingService';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { GroupMemberRole } from '@/services/groupService';
import { Rating } from '@/types/Rating';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';
import { copyToClipboard } from '@/utils/clipboard';
import { addTestRatingsDirectly } from '@/scripts/addTestRatingsDirectly';

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

interface LoaderData {
  group: Group;
  memberCount: number;
  members: GroupMember[];
  userRole: GroupMemberRole;
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { getRoleColor, getRoleLabel } = useGroupPermissions();

  // Get the group data from the loader
  const loaderData = useLoaderData() as LoaderData;
  const {
    group: loaderGroup,
    memberCount: loaderMemberCount,
    members: loaderMembers,
    userRole: loaderUserRole,
  } = loaderData;

  // Initialize state with loader data
  const [group, setGroup] = useState<Group | null>(
    loaderGroup ? { ...loaderGroup, userRole: loaderUserRole } : null
  );
  const [memberCount, setMemberCount] = useState<number>(loaderMemberCount || 0);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(loaderMembers || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState<number>(0);
  const [hasRatedToday, setHasRatedToday] = useState<boolean>(false);
  const [todayRatings, setTodayRatings] = useState<Rating[]>([]);
  const [calendarRatings, setCalendarRatings] = useState<Rating[]>([]);

  // New states for leave group confirmation modal
  const [leaveGroupModalOpen, setLeaveGroupModalOpen] = useState<boolean>(false);
  const [leaveGroupLoading, setLeaveGroupLoading] = useState<boolean>(false);

  // Set up real-time subscriptions for group data
  useEffect(() => {
    if (!groupId || !auth?.myUser?.userId) return;

    // Subscribe to group updates
    const groupUnsubscribe = groupService.subscribeToGroup(groupId, updatedGroup => {
      if (updatedGroup) {
        setGroup(prevGroup => {
          if (!prevGroup) return updatedGroup;
          return { ...updatedGroup, userRole: prevGroup.userRole };
        });
      } else {
        // Group was deleted
        setNotification({
          message: 'This group has been deleted',
          type: 'info',
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    });

    // Subscribe to group members updates
    const membersUnsubscribe = groupService.subscribeToGroupMembers(groupId, updatedMembers => {
      setGroupMembers(updatedMembers);
      setMemberCount(updatedMembers.length);
    });

    // Clean up subscriptions when component unmounts
    return () => {
      groupUnsubscribe();
      membersUnsubscribe();
    };
  }, [groupId, auth?.myUser?.userId, navigate]);

  // Set up real-time subscriptions for rating data
  useEffect(() => {
    if (!groupId || !auth?.myUser?.userId) return;
    if (!auth.myUser) return;

    setLoading(true);
    setError(null);

    // Get today's date in YYYY-MM-DD format
    const today = dayjs().format('YYYY-MM-DD');

    // Get date range for calendar (last 30 days)
    const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const todayFormatted = dayjs().format('YYYY-MM-DD');

    // Subscribe to today's ratings
    const todayRatingsUnsubscribe = ratingService.subscribeToRatingsForDateRange(
      groupId,
      today,
      today,
      (ratings: Rating[]) => {
        setTodayRatings(ratings);
      }
    );

    // Subscribe to calendar ratings
    const calendarRatingsUnsubscribe = ratingService.subscribeToRatingsForDateRange(
      groupId,
      thirtyDaysAgo,
      todayFormatted,
      (ratings: Rating[]) => {
        setCalendarRatings(ratings);
      }
    );

    // Check if user has rated today
    const checkUserRatedToday = async () => {
      try {
        const hasRated = await ratingService.hasUserRatedToday(groupId, auth.myUser!.userId);
        setHasRatedToday(hasRated);
      } catch (err) {
        console.error('Error checking if user rated today:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUserRatedToday();

    // Clean up subscriptions when component unmounts
    return () => {
      todayRatingsUnsubscribe();
      calendarRatingsUnsubscribe();
    };
  }, [groupId, auth?.myUser?.userId]);

  // Subscribe to ratings for the selected date in the calendar
  useEffect(() => {
    if (!groupId || !auth?.myUser?.userId) return;
    if (!auth.myUser) return;
    if (activeTab !== 1) return; // Only subscribe when calendar tab is active

    const dateStr = selectedDate.format('YYYY-MM-DD');

    // Subscribe to ratings for the selected date
    const selectedDateRatingsUnsubscribe = ratingService.subscribeToRatingsForDateRange(
      groupId,
      dateStr,
      dateStr,
      (ratings: Rating[]) => {
        // Update the calendarRatings with the selected date ratings
        // This ensures we have the most up-to-date data for the selected date
        setCalendarRatings(prevRatings => {
          // Filter out any existing ratings for the selected date
          const filteredRatings = prevRatings.filter(rating => rating.ratingDate !== dateStr);
          // Add the new ratings for the selected date
          return [...filteredRatings, ...ratings];
        });
      }
    );

    // Clean up subscription when component unmounts or selected date changes
    return () => {
      selectedDateRatingsUnsubscribe();
    };
  }, [groupId, auth?.myUser?.userId, selectedDate, activeTab]);

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

  // Show the leave group confirmation modal
  const handleLeaveGroupClick = () => {
    setLeaveGroupModalOpen(true);
  };

  // Close the leave group confirmation modal
  const handleCloseLeaveGroupModal = () => {
    setLeaveGroupModalOpen(false);
  };

  // Handle the actual leaving process
  const handleLeaveGroup = async () => {
    if (!groupId || !auth?.myUser?.userId) return;

    try {
      setLeaveGroupLoading(true);
      await groupService.removeMemberFromGroup(groupId, auth.myUser.userId);

      // Close the modal
      setLeaveGroupModalOpen(false);

      // Show success notification
      setNotification({
        message: 'You have left the group',
        type: 'success',
      });

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error leaving group:', error);
      setNotification({
        message: 'Failed to leave the group',
        type: 'error',
      });
    } finally {
      setLeaveGroupLoading(false);
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleCalendarDateSelected = (dateStr: string) => {
    // This function is called by the MoodCalendar component when a date is selected
    // We can use this to trigger additional actions if needed
    console.log(`Date selected in calendar: ${dateStr}`);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMoodSubmit = async (rating: number, note: string) => {
    if (!groupId || !auth?.myUser?.userId) return;

    try {
      setLoading(true);

      // Create the rating
      await ratingService.createRating(groupId, auth.myUser.userId, rating, note);

      // No need to manually update the state - the subscription will handle it
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

  const handleAddTestRatingsDirectly = async () => {
    try {
      await addTestRatingsDirectly();
      setNotification({
        message: 'Test ratings added directly to the database!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error adding test ratings directly:', error);
      setNotification({
        message: 'Failed to add test ratings directly',
        type: 'error',
      });
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
            onLeave={handleLeaveGroupClick}
            currentUserId={auth?.myUser?.userId}
          />

          {import.meta.env.DEV && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={handleAddTestRatingsDirectly}
                sx={{ mb: 2 }}
              >
                Add Test Ratings Directly
              </Button>
            </>
          )}

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
              onDateSelected={handleCalendarDateSelected}
              isLoading={loading}
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

      {/* Leave Group Confirmation Modal */}
      <Dialog
        open={leaveGroupModalOpen}
        onClose={!leaveGroupLoading ? handleCloseLeaveGroupModal : undefined}
        aria-labelledby="leave-group-dialog-title"
        aria-describedby="leave-group-dialog-description"
        disableEscapeKeyDown={leaveGroupLoading}
      >
        <DialogTitle id="leave-group-dialog-title">Leave Group</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {leaveGroupLoading ? <CircularProgress size={24} sx={{ mr: 2 }} /> : null}
            <Box>
              Are you sure you want to leave "{group?.groupName}"? You will need to be invited again
              to rejoin.
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLeaveGroupModal} disabled={leaveGroupLoading} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleLeaveGroup}
            color="error"
            variant="contained"
            disabled={leaveGroupLoading}
            startIcon={leaveGroupLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {leaveGroupLoading ? 'Leaving...' : 'Leave Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
