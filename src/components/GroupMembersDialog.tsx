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
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Snackbar,
  Badge,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';

import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';
import { MyUser } from '@/types/MyUser';
import { GroupMemberRole } from '@/types/GroupMemberRole';
import { getRoleColor, getRoleLabel, canManageMember, canRemoveMember } from '@/utils/roleUtils';

interface GroupMembersDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  user: MyUser;
  onMemberUpdate?: (member: GroupMember) => void;
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
  onMemberUpdate,
}: GroupMembersDialogProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Subscribe to group members updates
  useEffect(() => {
    if (!open || !group) return;

    setIsLoading(true);
    setError(null);

    // Subscribe to group members updates
    const unsubscribe = groupService.subscribeToGroupMembers(group.groupId, updatedMembers => {
      setMembers(updatedMembers);
      setIsLoading(false);
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

      // Notify parent component of the role update
      if (onMemberUpdate) {
        onMemberUpdate({
          ...selectedMember,
          role: newRole,
        });
      }

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

  const handleRemoveMember = async (member: GroupMember) => {
    if (!group) return;

    try {
      setIsUpdating(true);
      setError(null);
      await groupService.removeMemberFromGroup(group.groupId, member.userId);
      setSelectedMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsUpdating(false);
    }
  };

  const isGroupCreator = (member: GroupMember) => {
    return member.userId === group.createdBy;
  };

  const isCurrentUser = (member: GroupMember) => {
    return member.userId === user.userId;
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

          {isLoading ? (
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
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: isCurrentUser(member) ? 'action.selected' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      border: isCurrentUser(member) ? '1px solid' : 'none',
                      borderColor: 'primary.light',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          isGroupCreator(member) ? (
                            <StarIcon sx={{ color: 'primary.main', fontSize: '1rem' }} />
                          ) : isCurrentUser(member) ? (
                            <PersonIcon
                              sx={{
                                color: 'secondary.dark',
                                backgroundColor: 'secondary.light',
                                borderRadius: '50%',
                                fontSize: '1rem',
                              }}
                            />
                          ) : null
                        }
                      >
                        <Avatar
                          src={member.photoURL}
                          alt={member.displayName}
                          sx={{
                            border: isGroupCreator(member) ? '2px solid' : 'none',
                            borderColor: 'primary.main',
                            width: isGroupCreator(member) ? 48 : 40,
                            height: isGroupCreator(member) ? 48 : 40,
                          }}
                        >
                          {member.displayName.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: isGroupCreator(member) ? 'bold' : 'normal',
                              color: isGroupCreator(member) ? 'primary.main' : 'text.primary',
                            }}
                          >
                            {member.displayName}
                            {isCurrentUser(member) && (
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  ml: 1,
                                  color: 'secondary.main',
                                  fontWeight: 'bold',
                                }}
                              >
                                (You)
                              </Typography>
                            )}
                          </Typography>
                          {isGroupCreator(member) && (
                            <Chip
                              size="small"
                              label="Creator"
                              color="primary"
                              sx={{
                                ml: 1,
                                fontWeight: 'bold',
                                backgroundColor: 'primary.light',
                                color: 'primary.dark',
                              }}
                            />
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
                            label={getRoleLabel(member.role)}
                            color={getRoleColor(member.role)}
                            size="small"
                          />
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    {canManageMember(
                      group.userRole || GroupMemberRole.MEMBER,
                      member.role || GroupMemberRole.MEMBER,
                      member.userId === user.userId,
                      member.role === GroupMemberRole.ADMIN
                    ) && (
                      <IconButton size="small" onClick={event => handleMenuOpen(event, member)}>
                        <MoreVertIcon />
                      </IconButton>
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
        {selectedMember &&
          canRemoveMember(
            group.userRole || GroupMemberRole.MEMBER,
            selectedMember.role || GroupMemberRole.MEMBER,
            selectedMember.userId === user.userId,
            selectedMember.role === GroupMemberRole.ADMIN
          ) && (
            <MenuItem
              onClick={() => handleRemoveMember(selectedMember)}
              disabled={isUpdating}
              sx={{ color: 'error.main' }}
            >
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
