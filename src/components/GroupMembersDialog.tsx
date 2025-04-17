import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
  Snackbar,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { MyUser } from '@/types/MyUser';
import { GroupMemberRole } from '@/services/groupService';

interface GroupMembersDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  user: MyUser;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function GroupMembersDialog({
  open,
  onClose,
  group,
  user,
}: GroupMembersDialogProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Subscribe to group members updates
  useEffect(() => {
    if (!open || !group) return;

    setLoading(true);
    setError(null);

    // Subscribe to group members updates
    const unsubscribe = groupService.subscribeToGroupMembers(group.groupId, updatedMembers => {
      setMembers(updatedMembers);
      setLoading(false);
    });

    // Clean up subscription when component unmounts or dialog closes
    return () => {
      unsubscribe();
    };
  }, [open, group]);

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
    onClose();
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: GroupMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleUpdateRole = async (newRole: GroupMemberRole) => {
    if (!selectedMember) return;

    try {
      setIsUpdating(true);

      // Check if trying to make someone an admin when there's already an admin
      if (newRole === GroupMemberRole.ADMIN) {
        const existingAdmin = members.find(m => m.role === GroupMemberRole.ADMIN);
        if (existingAdmin && existingAdmin.userId !== selectedMember.userId) {
          setNotification({
            message: 'A group can only have one admin (the creator)',
            type: 'error',
          });
          handleMenuClose();
          setIsUpdating(false);
          return;
        }
      }

      await groupService.updateMemberRole(group.groupId, selectedMember.userId, newRole);

      setNotification({
        message: `Role updated to ${newRole}`,
        type: 'success',
      });

      handleMenuClose();
    } catch (err) {
      console.error('Error updating member role:', err);
      setNotification({
        message: 'Failed to update member role',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      setIsUpdating(true);

      // Prevent removing the admin (group creator)
      if (selectedMember.role === GroupMemberRole.ADMIN) {
        setNotification({
          message: 'Cannot remove the group admin (creator)',
          type: 'error',
        });
        handleMenuClose();
        setIsUpdating(false);
        return;
      }

      await groupService.removeMemberFromGroup(group.groupId, selectedMember.userId);

      setNotification({
        message: 'Member removed from group',
        type: 'success',
      });

      handleMenuClose();
    } catch (err) {
      console.error('Error removing member:', err);
      setNotification({
        message: 'Failed to remove member',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleChipColor = (role: GroupMemberRole) => {
    switch (role) {
      case GroupMemberRole.ADMIN:
        return 'primary';
      case GroupMemberRole.MODERATOR:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const canManageMember = (member: GroupMember) => {
    // Can't manage the admin (group creator)
    if (member.role === GroupMemberRole.ADMIN) {
      return false;
    }

    // Admins and moderators can manage regular members
    return group.userRole === GroupMemberRole.ADMIN || group.userRole === GroupMemberRole.MODERATOR;
  };

  const canRemoveMember = (member: GroupMember) => {
    // Can't remove yourself
    if (member.userId === user.userId) {
      return false;
    }

    // Can't remove the admin (group creator)
    if (member.role === GroupMemberRole.ADMIN) {
      return false;
    }

    // Admins and moderators can remove regular members
    return group.userRole === GroupMemberRole.ADMIN || group.userRole === GroupMemberRole.MODERATOR;
  };

  const isGroupCreator = (member: GroupMember) => {
    return member.userId === group.createdBy;
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {group.groupName} - Members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : members.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No members found
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {members.map((member, index) => (
                <Box key={member.userId}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={member.photoURL} alt={member.displayName}>
                        {member.displayName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{member.displayName}</Typography>
                          {isGroupCreator(member) && (
                            <Chip size="small" label="Creator" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ mr: 1 }}
                          >
                            {member.email}
                          </Typography>
                          <Chip
                            size="small"
                            label={member.role}
                            color={getRoleChipColor(member.role)}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    {canManageMember(member) && (
                      <ListItemSecondaryAction>
                        <Tooltip title="Manage member">
                          <IconButton
                            edge="end"
                            aria-label="more"
                            onClick={e => handleMenuOpen(e, member)}
                            disabled={isUpdating}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  {index < members.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedMember && selectedMember.role !== GroupMemberRole.MODERATOR && (
          <MenuItem
            onClick={() => handleUpdateRole(GroupMemberRole.MODERATOR)}
            disabled={isUpdating}
          >
            Make Moderator
          </MenuItem>
        )}
        {selectedMember && selectedMember.role !== GroupMemberRole.MEMBER && (
          <MenuItem onClick={() => handleUpdateRole(GroupMemberRole.MEMBER)} disabled={isUpdating}>
            Make Member
          </MenuItem>
        )}
        {selectedMember && canRemoveMember(selectedMember) && (
          <MenuItem onClick={handleRemoveMember} disabled={isUpdating} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Remove from Group
          </MenuItem>
        )}
      </Menu>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        message={notification?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
