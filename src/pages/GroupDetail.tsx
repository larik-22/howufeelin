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
  Button,
} from '@mui/material';
import dayjs from 'dayjs';

import AuthContext from '@/contexts/auth/authContext';
import { groupService } from '@/services/groupService';
import { ratingService, RatingError } from '@/services/ratingService';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { GroupMemberRole } from '@/services/groupService';
import { Rating } from '@/types/Rating';
import { useGroupPermissions, GroupPermission } from '@/hooks/useGroupPermissions';
import { copyToClipboard } from '@/utils/clipboard';
import { addTestRatingsDirectly } from '@/scripts/addTestRatingsDirectly';
import { useLeaveGroup } from '@/hooks/useLeaveGroup';

import { GroupHeader } from '@/components/group/GroupHeader';
import { GroupDetails } from '@/components/group/GroupDetails';
import { MoodInput } from '@/components/mood/MoodInput';
import { MoodCalendar } from '@/components/mood/MoodCalendar';
import { GroupMembers } from '@/components/group/GroupMembers';
import { RatingList } from '@/components/mood/RatingList';
import GroupMembersDialog from '@/components/GroupMembersDialog';
import GroupFormDialog from '@/components/GroupFormDialog';
import LeaveGroupDialog from '@/components/LeaveGroupDialog';

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
  const { getRoleColor, getRoleLabel, hasPermission } = useGroupPermissions();

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

  // New state for Group Members Dialog
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use our custom hook for leave group functionality
  const {
    leaveGroupModalOpen,
    handleLeaveGroupClick,
    handleCloseLeaveGroupModal,
    selectedGroup: groupToLeave,
  } = useLeaveGroup(
    auth?.myUser?.userId,
    () => {
      // Success callback
      setNotification({
        message: 'You have left the group',
        type: 'success',
      });

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    },
    message => {
      // Error callback
      setNotification({
        message,
        type: 'error',
      });
    }
  );

  // Set up real-time subscriptions for group data
  useEffect(() => {
    if (!groupId || !auth?.myUser?.userId) return;

    // Subscribe to group updates
    const groupUnsubscribe = groupService.subscribeToGroup(groupId, updatedGroup => {
      if (updatedGroup) {
        setGroup(prevGroup => {
          if (!prevGroup) return updatedGroup;
          // Preserve the user's role when updating the group
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

      // Update the current user's role if it has changed
      const currentUserMember = updatedMembers.find(m => m.userId === auth.myUser?.userId);
      if (currentUserMember) {
        setGroup(prevGroup => {
          if (!prevGroup) return prevGroup;
          return { ...prevGroup, userRole: currentUserMember.role };
        });
      }
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

  const handleOpenMembersDialog = () => {
    setIsMembersDialogOpen(true);
  };

  const handleCloseMembersDialog = () => {
    setIsMembersDialogOpen(false);
  };

  const handleOpenEditDialog = () => {
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  const handleGroupUpdate = (updatedGroup: Group) => {
    // Update local state immediately for better UX
    setGroup(prevGroup => ({
      ...prevGroup!,
      groupName: updatedGroup.groupName,
      groupDescription: updatedGroup.groupDescription,
    }));
  };

  const handleMemberUpdate = (updatedMember: GroupMember) => {
    if (!group) return;

    // Update the group members state
    setGroupMembers(prevMembers =>
      prevMembers.map(member => (member.userId === updatedMember.userId ? updatedMember : member))
    );

    // If the updated member is the current user, update their role in the group state
    if (updatedMember.userId === auth?.myUser?.userId) {
      setGroup(prevGroup => {
        if (!prevGroup) return prevGroup;
        return { ...prevGroup, userRole: updatedMember.role };
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {/* Header Skeleton */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: { xs: 2, sm: 3 },
            position: 'relative',
            width: '100%',
          }}
        >
          <Skeleton variant="rectangular" width={80} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto' }} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>

        {/* Group Details Skeleton */}
        <Card sx={{ mb: { xs: 2, sm: 3 }, boxShadow: 3, borderRadius: 2 }}>
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
        <Box sx={{ display: 'flex', mb: { xs: 2, sm: 3 }, overflowX: 'auto' }}>
          <Skeleton variant="rectangular" width={100} height={48} sx={{ mr: 1, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={48} sx={{ mr: 1, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={48} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Content Skeleton */}
        <Card sx={{ mb: { xs: 2, sm: 3 }, boxShadow: 3, borderRadius: 2 }}>
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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {group && (
        <>
          <GroupHeader
            group={group}
            onBack={handleBackToDashboard}
            onLeave={() => handleLeaveGroupClick(group)}
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
            onEdit={handleOpenEditDialog}
            canEdit={hasPermission(group, GroupPermission.EDIT_GROUP)}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                flexGrow: 1,
                '& .MuiTab-root': {
                  minWidth: { xs: 'auto', sm: 120 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                },
              }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab label="Today's Moods" />
              <Tab label="Calendar" />
              <Tab label="Members" />
            </Tabs>
          </Box>

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
              onManageMembers={handleOpenMembersDialog}
              canManageMembers={hasPermission(group, GroupPermission.MANAGE_MEMBERS)}
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

      {/* Leave Group Dialog */}
      {groupToLeave && auth?.myUser && (
        <LeaveGroupDialog
          open={leaveGroupModalOpen}
          onClose={handleCloseLeaveGroupModal}
          group={groupToLeave}
          userId={auth.myUser.userId}
          onSuccess={() => {
            // Navigate to dashboard immediately after successful leave
            navigate('/dashboard');
          }}
          onError={message => {
            setNotification({
              message,
              type: 'error',
            });
          }}
        />
      )}

      {/* Group Members Dialog */}
      {group && auth?.myUser && (
        <GroupMembersDialog
          open={isMembersDialogOpen}
          onClose={handleCloseMembersDialog}
          group={group}
          user={auth.myUser}
          onMemberUpdate={handleMemberUpdate}
        />
      )}

      {/* Group Edit Dialog */}
      {group && auth?.myUser && (
        <GroupFormDialog
          open={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onSubmit={handleGroupUpdate}
          mode="edit"
          group={group}
          user={auth.myUser}
        />
      )}
    </Box>
  );
}
