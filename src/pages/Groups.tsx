import { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GroupFormDialog from '@/components/GroupFormDialog';
import JoinGroupDialog from '@/components/JoinGroupDialog';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { useGroupPermissions, GroupPermission } from '@/hooks/useGroupPermissions';
import { copyToClipboard } from '@/utils/clipboard';

// Constants
const DESCRIPTION_MAX_LENGTH = 100;

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Groups() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { hasPermission, getRoleColor, getRoleLabel } = useGroupPermissions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Use useCallback to memoize the fetchGroups function
  const fetchGroups = useCallback(async () => {
    if (!auth?.myUser?.userId) return;

    try {
      setLoading(true);
      setError(null);
      const userGroups = await groupService.getUserGroups(auth.myUser.userId);
      setGroups(userGroups);

      // Fetch member counts for all groups in a single query
      if (userGroups.length > 0) {
        const groupIds = userGroups.map(group => group.groupId);
        const counts = await groupService.getGroupMemberCounts(groupIds);
        setMemberCounts(counts);
      } else {
        setMemberCounts({});
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [auth?.myUser?.userId]);

  // Set up real-time subscription for user groups
  useEffect(() => {
    if (!auth?.myUser?.userId) return;

    setLoading(true); // Set loading when starting subscription

    // Subscribe to user groups updates
    const unsubscribe = groupService.subscribeToUserGroups(auth.myUser.userId, updatedGroups => {
      setGroups(updatedGroups);
      setLoading(false); // Clear loading when groups are received

      // Set up subscriptions for each group's members
      const memberCountSubscriptions = updatedGroups.map(group => {
        return groupService.subscribeToGroupMembers(group.groupId, members => {
          setMemberCounts(prevCounts => ({
            ...prevCounts,
            [group.groupId]: members.length,
          }));
        });
      });

      // Clean up subscriptions for groups that are no longer in the list
      setMemberCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        Object.keys(newCounts).forEach(groupId => {
          if (!updatedGroups.some(group => group.groupId === groupId)) {
            delete newCounts[groupId];
          }
        });
        return newCounts;
      });

      // Clean up subscriptions when component unmounts or groups change
      return () => {
        memberCountSubscriptions.forEach(unsubscribe => unsubscribe());
      };
    });

    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
      setLoading(false); // Ensure loading is cleared on unmount
    };
  }, [auth?.myUser?.userId]);

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setSelectedGroup(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (group: Group) => {
    setDialogMode('edit');
    setSelectedGroup(group);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleGroupCreated = () => {
    // No need to clear cache with real-time subscriptions
    fetchGroups();
    setNotification({
      message: 'Group created successfully',
      type: 'success',
    });
  };

  const handleCopyJoinCode = async (joinCode: string) => {
    const success = await copyToClipboard(joinCode);
    if (success) {
      setCopiedCode(joinCode);
      setNotification({
        message: 'Join code copied to clipboard',
        type: 'success',
      });
      setTimeout(() => setCopiedCode(null), 1000); // Reset after 1 seconds
    } else {
      setNotification({
        message: 'Failed to copy join code',
        type: 'error',
      });
    }
  };

  const toggleDescription = (groupId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const truncateDescription = (description: string, groupId: string) => {
    if (description.length <= DESCRIPTION_MAX_LENGTH) {
      return description;
    }

    return expandedDescriptions[groupId]
      ? description
      : `${description.substring(0, DESCRIPTION_MAX_LENGTH)}...`;
  };

  const handleOpenJoinDialog = () => {
    setIsJoinDialogOpen(true);
  };

  const handleJoinDialogClose = () => {
    setIsJoinDialogOpen(false);
  };

  const handleJoinSuccess = (groupName: string) => {
    setNotification({
      message: `Successfully joined ${groupName}!`,
      type: 'success',
    });
    // No need to manually refresh groups as the subscription will handle updates
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleNavigateToGroupDetail = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  const handleOpenDeleteDialog = (group: Group) => {
    setSelectedGroup(group);
    setDeletingGroupId(group.groupId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedGroup(null);
    setDeletingGroupId(null);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !auth?.myUser?.userId) return;

    try {
      setIsDeleting(true);
      await groupService.deleteGroup(selectedGroup.groupId, auth.myUser.userId);

      // No need to clear cache with real-time subscriptions
      // Refresh the groups list
      fetchGroups();

      setNotification({
        message: `Group "${selectedGroup.groupName}" deleted successfully`,
        type: 'success',
      });

      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting group:', err);
      setNotification({
        message:
          err instanceof Error ? err.message : 'Failed to delete group. Please try again later.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setDeletingGroupId(null);
    }
  };

  const renderGroupCard = (group: Group) => {
    const isDeletingThisGroup = deletingGroupId === group.groupId;

    return (
      <Card
        key={group.groupId}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: isDeletingThisGroup ? 'not-allowed' : 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          opacity: isDeletingThisGroup ? 0.7 : 1,
          '&:hover': {
            transform: isDeletingThisGroup ? 'none' : 'translateY(-4px)',
            boxShadow: isDeletingThisGroup ? 1 : 4,
          },
        }}
        onClick={() => !isDeletingThisGroup && handleNavigateToGroupDetail(group.groupId)}
      >
        <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
            <GroupIcon
              sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}
            />
            <Typography
              variant="h6"
              component="h3"
              sx={{
                flexGrow: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              {group.groupName}
              {isDeletingThisGroup && (
                <CircularProgress size={16} sx={{ ml: 1, display: 'inline-block' }} />
              )}
            </Typography>
            {hasPermission(group, GroupPermission.EDIT_GROUP) && !isDeletingThisGroup && (
              <Tooltip title="Edit Group">
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation(); // Prevent card click when clicking edit button
                    handleOpenEditDialog(group);
                  }}
                  sx={{ ml: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(group, GroupPermission.DELETE_GROUP) && !isDeletingThisGroup && (
              <Tooltip title="Delete Group">
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation(); // Prevent card click when clicking delete button
                    handleOpenDeleteDialog(group);
                  }}
                  sx={{ ml: 1 }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {truncateDescription(group.groupDescription, group.groupId)}
            </Typography>
            {group.groupDescription.length > DESCRIPTION_MAX_LENGTH && (
              <Button
                size="small"
                onClick={e => {
                  e.stopPropagation(); // Prevent card click when clicking show more/less
                  toggleDescription(group.groupId);
                }}
                sx={{
                  mt: 0.5,
                  p: 0,
                  minWidth: 'auto',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                }}
                endIcon={
                  expandedDescriptions[group.groupId] ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
              >
                {expandedDescriptions[group.groupId] ? 'Show less' : 'Show more'}
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
            <PeopleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {memberCounts[group.groupId] || 0}{' '}
              {memberCounts[group.groupId] === 1 ? 'member' : 'members'}
            </Typography>
            <Chip
              size="small"
              label={getRoleLabel(group.userRole)}
              sx={{
                ml: 1,
                height: { xs: 20, sm: 24 },
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
              }}
              color={getRoleColor(group.userRole)}
            />
          </Box>
          <Chip
            label={`Join Code: ${group.joinCode}`}
            size="small"
            variant="outlined"
            sx={{
              mt: 1,
              height: { xs: 24, sm: 28 },
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
            }}
            onClick={e => {
              e.stopPropagation(); // Prevent card click when clicking join code
              handleCopyJoinCode(group.joinCode);
            }}
            icon={<ContentCopyIcon fontSize="small" />}
            color={copiedCode === group.joinCode ? 'success' : 'default'}
          />
        </CardContent>
        <CardActions sx={{ p: { xs: 1, sm: 2 }, pt: 0 }}>
          {hasPermission(group, GroupPermission.MANAGE_MEMBERS) && !isDeletingThisGroup ? (
            <Button
              size="small"
              color="primary"
              onClick={e => {
                e.stopPropagation(); // Prevent card click when clicking manage members
                // This will be implemented in the future
              }}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              Manage Members
            </Button>
          ) : null}
        </CardActions>
      </Card>
    );
  };

  if (!auth || !auth.firebaseUser || !auth.myUser) return null;

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography variant="h5" component="h2">
          My Groups
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PeopleIcon />}
            onClick={handleOpenJoinDialog}
            fullWidth={false}
            sx={{
              minWidth: { xs: '48%', sm: 'auto' },
              whiteSpace: 'nowrap',
            }}
          >
            Join Group
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            fullWidth={false}
            sx={{
              minWidth: { xs: '48%', sm: 'auto' },
              whiteSpace: 'nowrap',
            }}
          >
            Create Group
          </Button>
        </Box>
      </Box>

      {groups.length === 0 ? (
        <Card sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            You haven't joined any groups yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new group or ask someone to share their group's join code with you
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Your First Group
          </Button>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {groups.map(renderGroupCard)}
        </Box>
      )}

      <GroupFormDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleGroupCreated}
        mode={dialogMode}
        group={selectedGroup}
        user={auth.myUser}
      />

      <JoinGroupDialog
        open={isJoinDialogOpen}
        onClose={handleJoinDialogClose}
        onSuccess={handleJoinSuccess}
        user={auth.myUser}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={isDeleting ? undefined : handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        fullScreen={isMobile}
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          {isDeleting && <CircularProgress size={20} sx={{ mr: 1 }} />}
          Delete Group
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the group "{selectedGroup?.groupName}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteGroup}
            color="error"
            disabled={isDeleting}
            autoFocus
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        message={notification?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
