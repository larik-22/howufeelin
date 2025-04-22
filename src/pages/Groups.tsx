import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import {
  Typography,
  Box,
  Card,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupFormDialog from '@/components/GroupFormDialog';
import JoinGroupDialog from '@/components/JoinGroupDialog';
import GroupMembersDialog from '@/components/GroupMembersDialog';
import GroupFilters from '@/components/GroupFilters';
import GroupCard from '@/components/GroupCard';
import LeaveGroupDialog from '@/components/LeaveGroupDialog';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { GroupMemberRole } from '@/types/GroupMemberRole';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';
import { useGroupFilters, SortOption } from '@/hooks/useGroupFilters';
import { useLeaveGroup } from '@/hooks/useLeaveGroup';
import { useLoadingState } from '@/hooks/useLoadingState';
import { copyToClipboard } from '@/utils/clipboard';

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

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);

  // Data states
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Use our custom loading state hook
  const displayLoading = useLoadingState(isLoading, [auth?.myUser?.userId]);
  const displayDeleting = useLoadingState(isDeleting, [deletingGroupId]);

  // Use our custom hook for filtering
  const {
    searchQuery,
    activeFilterTab,
    sortOption,
    showFilters,
    filteredGroups,
    handleSearchChange,
    handleFilterTabChange,
    handleSortChange,
    toggleFilters,
    clearFilters,
  } = useGroupFilters({ groups, memberCounts });

  // Use our custom hook for leave group functionality
  const {
    leaveGroupModalOpen,
    handleLeaveGroupClick,
    handleCloseLeaveGroupModal,
    selectedGroup: groupToLeave,
  } = useLeaveGroup(
    auth?.myUser?.userId,
    () => {
      // Success callback - the real-time subscription will handle updating the groups list
      setNotification({
        message: 'You have left the group',
        type: 'success',
      });
    },
    message => {
      // Error callback
      setNotification({
        message,
        type: 'error',
      });
    }
  );

  // Set up real-time subscription for user groups
  useEffect(() => {
    if (!auth?.myUser?.userId) return;

    setIsLoading(true); // Set loading when starting subscription
    let memberCountSubscription = () => {};
    const memberRoleSubscriptions: (() => void)[] = [];

    console.log('Setting up user groups subscription for user:', auth.myUser.userId);

    // Subscribe to user groups updates
    const unsubscribe = groupService.subscribeToUserGroups(auth.myUser.userId, updatedGroups => {
      console.log('Received updated groups from subscription:', updatedGroups);

      // Update the groups state with the new data
      setGroups(updatedGroups);

      // Clean up previous subscriptions
      memberCountSubscription();
      memberRoleSubscriptions.forEach(unsubscribe => unsubscribe());
      memberRoleSubscriptions.length = 0;

      // Set up a single subscription for all group member counts
      if (updatedGroups.length > 0) {
        const groupIds = updatedGroups.map(group => group.groupId);
        console.log('Setting up member count subscription for groups:', groupIds);

        const countUnsubscribe = groupService.subscribeToGroupMemberCounts(groupIds, counts => {
          console.log('Updating member counts for all groups:', counts);
          setMemberCounts(counts);
        });
        memberCountSubscription = countUnsubscribe;
      } else {
        // If there are no groups, reset the member counts
        setMemberCounts({});
      }

      // Set up subscriptions for member role updates
      updatedGroups.forEach(group => {
        console.log('Setting up member role subscription for group:', group.groupId);

        // Subscribe to member role updates
        const roleUnsubscribe = groupService.subscribeToGroupMembers(group.groupId, members => {
          // Find the current user's role in this group
          const currentUserMember = members.find(m => m.userId === auth.myUser?.userId);
          if (currentUserMember) {
            console.log(
              'Updating user role for group:',
              group.groupId,
              'to:',
              currentUserMember.role
            );

            // Update the group with the new role
            setGroups(prevGroups =>
              prevGroups.map(g =>
                g.groupId === group.groupId ? { ...g, userRole: currentUserMember.role } : g
              )
            );
          }
        });
        memberRoleSubscriptions.push(roleUnsubscribe);
      });

      // Clean up member counts for groups that are no longer in the list
      setMemberCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        Object.keys(newCounts).forEach(groupId => {
          if (!updatedGroups.some(group => group.groupId === groupId)) {
            delete newCounts[groupId];
          }
        });
        return newCounts;
      });

      setIsLoading(false); // Clear loading when groups are received
    });

    // Clean up all subscriptions when component unmounts
    return () => {
      console.log('Cleaning up all subscriptions');
      unsubscribe();
      memberCountSubscription();
      memberRoleSubscriptions.forEach(unsubscribe => unsubscribe());
      setIsLoading(false); // Ensure loading is cleared on unmount
    };
  }, [auth?.myUser?.userId]);

  // Dialog handlers
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

  const handleGroupCreated = (newGroup: Group) => {
    // Add the new group to the local state immediately
    setGroups(prevGroups => {
      // Check if the group already exists in the list
      const exists = prevGroups.some(group => group.groupId === newGroup.groupId);
      if (exists) {
        // Update the existing group
        return prevGroups.map(group => (group.groupId === newGroup.groupId ? newGroup : group));
      } else {
        // Add the new group to the list
        return [...prevGroups, newGroup];
      }
    });

    // Update member counts for the new group
    setMemberCounts(prevCounts => ({
      ...prevCounts,
      [newGroup.groupId]: 1, // The creator is the first member
    }));

    // Show success notification
    setNotification({
      message:
        dialogMode === 'create' ? 'Group created successfully' : 'Group updated successfully',
      type: 'success',
    });

    // Close the dialog
    handleDialogClose();
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

    // Ensure only admins can delete groups
    if (selectedGroup.userRole !== GroupMemberRole.ADMIN) {
      setNotification({
        message: 'Only the group admin (creator) can delete the group',
        type: 'error',
      });
      handleCloseDeleteDialog();
      return;
    }

    try {
      setIsDeleting(true);
      setDeletingGroupId(selectedGroup.groupId);

      // Store the group ID and name before deletion for cleanup
      const groupIdToDelete = selectedGroup.groupId;
      const groupNameToDelete = selectedGroup.groupName;

      // Close the dialog immediately to prevent UI from freezing
      handleCloseDeleteDialog();

      // Delete the group
      await groupService.deleteGroup(groupIdToDelete, auth.myUser.userId);

      // Show success notification
      setNotification({
        message: `Group "${groupNameToDelete}" deleted successfully`,
        type: 'success',
      });

      // No need to manually update the groups list - the subscription will handle it
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

  const handleOpenMembersDialog = (group: Group) => {
    setSelectedGroupForMembers(group);
    setIsMembersDialogOpen(true);
  };

  const handleCloseMembersDialog = () => {
    setIsMembersDialogOpen(false);
    setSelectedGroupForMembers(null);
  };

  if (!auth || !auth.firebaseUser || !auth.myUser) return null;

  if (displayLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (notification && notification.type === 'error') {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{notification.message}</Alert>
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

      {/* Group Filters Component */}
      <GroupFilters
        searchQuery={searchQuery}
        activeFilterTab={activeFilterTab}
        sortOption={sortOption}
        showFilters={showFilters}
        groupsCount={groups.length}
        filteredGroupsCount={filteredGroups.length}
        onSearchChange={handleSearchChange}
        onFilterTabChange={handleFilterTabChange}
        onSortChange={handleSortChange as (event: SelectChangeEvent<SortOption>) => void}
        onToggleFilters={toggleFilters}
        onClearFilters={clearFilters}
      />

      {filteredGroups.length === 0 ? (
        <Card sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {groups.length === 0
              ? "You haven't joined any groups yet"
              : 'No groups match your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {groups.length === 0
              ? "Create a new group or ask someone to share their group's join code with you"
              : "Try adjusting your search or filters to find what you're looking for"}
          </Typography>
          {groups.length === 0 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Create Your First Group
            </Button>
          ) : (
            <Button variant="outlined" color="primary" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {filteredGroups.map(group => (
            <GroupCard
              key={group.groupId}
              group={group}
              memberCount={memberCounts[group.groupId] || 0}
              isExpanded={!!expandedDescriptions[group.groupId]}
              isDeleting={deletingGroupId === group.groupId}
              copiedCode={copiedCode}
              hasPermission={(group, permission) => hasPermission(group, permission)}
              getRoleColor={role => getRoleColor(role as GroupMemberRole)}
              getRoleLabel={role => getRoleLabel(role as GroupMemberRole)}
              onNavigateToDetail={handleNavigateToGroupDetail}
              onEdit={handleOpenEditDialog}
              onDelete={handleOpenDeleteDialog}
              onCopyJoinCode={handleCopyJoinCode}
              onToggleDescription={toggleDescription}
              onManageMembers={handleOpenMembersDialog}
              onLeaveGroup={handleLeaveGroupClick}
            />
          ))}
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

      {selectedGroupForMembers && (
        <GroupMembersDialog
          open={isMembersDialogOpen}
          onClose={handleCloseMembersDialog}
          group={selectedGroupForMembers}
          user={auth.myUser}
        />
      )}

      {/* Leave Group Dialog */}
      {groupToLeave && auth?.myUser && (
        <LeaveGroupDialog
          open={leaveGroupModalOpen}
          onClose={handleCloseLeaveGroupModal}
          group={groupToLeave}
          userId={auth.myUser.userId}
          onSuccess={() => {
            // The real-time subscription will handle updating the groups list
          }}
          onError={message => {
            setNotification({
              message,
              type: 'error',
            });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={displayDeleting ? undefined : handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        fullScreen={isMobile}
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          {displayDeleting && <CircularProgress size={20} sx={{ mr: 1 }} />}
          Delete Group
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the group "{selectedGroup?.groupName}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button onClick={handleCloseDeleteDialog} disabled={displayDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteGroup}
            color="error"
            disabled={displayDeleting}
            autoFocus
            startIcon={
              displayDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />
            }
          >
            {displayDeleting ? 'Deleting...' : 'Delete'}
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
