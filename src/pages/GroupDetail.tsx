import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';
import { copyToClipboard } from '@/utils/clipboard';

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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToGroups} sx={{ mr: 2 }}>
            Back to Groups
          </Button>
          <Typography variant="h5" component="h1">
            Error
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToGroups} sx={{ mr: 2 }}>
          Back to Groups
        </Button>
        <Typography variant="h5" component="h1">
          {group.groupName}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GroupIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Group Details</Typography>
            </Box>
            <Chip
              label={getRoleLabel(group.userRole)}
              color={getRoleColor(group.userRole)}
              size="small"
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 2 }}>
            {group.groupDescription || 'No description provided.'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PeopleIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor:
                  copiedCode === group.joinCode ? 'action.selected' : 'background.paper',
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
                {group.joinCode}
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => handleCopyJoinCode(group.joinCode)}
              >
                Copy
              </Button>
            </Paper>
          </Box>
        </CardContent>
      </Card>

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
