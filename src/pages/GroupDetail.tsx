import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import { Box, Tabs, Tab, Badge, Snackbar, Alert } from '@mui/material';
import dayjs from 'dayjs';

import AuthContext from '@/contexts/auth/authContext';
import { groupService, GroupMemberRole } from '@/services/groupService';
import { Group } from '@/types/Group';
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
  const [hasLeftGroup, setHasLeftGroup] = useState<boolean>(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId || !auth?.myUser?.userId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch member count
        const count = await groupService.getGroupMemberCount(groupId);

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

        // Check if user has already rated today
        const today = dayjs().format('YYYY-MM-DD');
        const userRating = mockUserRatings.find(
          rating => rating.userId === auth.myUser?.userId && rating.date === today
        );
        setHasRatedToday(!!userRating);
      } catch (err) {
        console.error('Error fetching group data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, auth?.myUser?.userId, loaderGroup]);

  const handleBackToGroups = () => {
    navigate('/dashboard');
  };

  const handleCopyJoinCode = async (joinCode: string) => {
    const success = await copyToClipboard(joinCode);
    if (success) {
      setCopiedCode(joinCode);
      setNotification({
        message: 'Join code copied to clipboard',
        type: 'success',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
    setCopiedCode(null);
  };

  const handleLeaveGroup = () => {
    setHasLeftGroup(true);
    setNotification({
      message: 'You have left the group',
      type: 'info',
    });
    // In a real app, you would make an API call here
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
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
    // This would be replaced with an actual API call to save the rating and note
    console.log('Submitting mood:', { rating, note });
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasRatedToday(true);
    setNotification({
      message: 'Mood rating submitted successfully',
      type: 'success',
    });
  };

  if (loading || !group) {
    return null; // You might want to add a loading spinner here
  }

  if (error) {
    return (
      <Box sx={{ py: 3 }}>
        <GroupHeader groupName="Error" onBack={handleBackToGroups} onLeave={handleLeaveGroup} />
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const mockMembers = [
    { name: 'John', role: 'ADMIN' as GroupMemberRole, avatar: '/static/images/avatar/1.jpg' },
    { name: 'Jane', role: 'MODERATOR' as GroupMemberRole, avatar: '/static/images/avatar/2.jpg' },
    { name: 'Bob', role: 'MEMBER' as GroupMemberRole, avatar: '/static/images/avatar/3.jpg' },
    { name: 'Alice', role: 'MEMBER' as GroupMemberRole, avatar: '/static/images/avatar/4.jpg' },
    { name: 'Charlie', role: 'MEMBER' as GroupMemberRole, avatar: '/static/images/avatar/5.jpg' },
  ];

  return (
    <Box sx={{ py: 3 }}>
      <GroupHeader
        groupName={group.groupName}
        onBack={handleBackToGroups}
        onLeave={handleLeaveGroup}
      />

      <GroupDetails
        groupName={group.groupName}
        groupDescription={group.groupDescription}
        memberCount={memberCount}
        joinCode={group.joinCode}
        userRole={group.userRole}
        onCopyJoinCode={handleCopyJoinCode}
        copiedCode={copiedCode}
        getRoleLabel={getRoleLabel}
        getRoleColor={getRoleColor}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="group tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge color="primary" variant="dot" invisible={!hasRatedToday} sx={{ mr: 1 }}>
                  Rate Mood
                </Badge>
              </Box>
            }
            id="tab-0"
            aria-controls="tabpanel-0"
            disabled={hasLeftGroup}
          />
          <Tab label="Calendar" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="Members" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
        {activeTab === 0 && <MoodInput hasRatedToday={hasRatedToday} onSubmit={handleMoodSubmit} />}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
        {activeTab === 1 && (
          <MoodCalendar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            ratings={mockUserRatings}
          />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-2" aria-labelledby="tab-2">
        {activeTab === 2 && (
          <GroupMembers
            members={mockMembers}
            getRoleLabel={getRoleLabel}
            getRoleColor={getRoleColor}
          />
        )}
      </Box>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.type || 'info'}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
