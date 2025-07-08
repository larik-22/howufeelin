import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Snackbar,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { MyUser } from '@/types/MyUser';
import { useLoadingState } from '@/hooks/useLoadingState';
import { copyToClipboard } from '@/utils/clipboard';
import { GroupMemberRole } from '@/types/GroupMemberRole';
import { Timestamp } from 'firebase/firestore';

// Validation constants
export const MAX_GROUP_NAME_LENGTH = 50;
export const MAX_GROUP_DESCRIPTION_LENGTH = 200;

export interface GroupFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (updatedGroup: Group) => void;
  mode: 'create' | 'edit';
  group: Group | null;
  user: MyUser;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function GroupFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  group,
  user,
}: GroupFormDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ groupId: string; joinCode: string } | null>(
    null
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use our custom loading state hook
  const displaySubmitting = useLoadingState(isSubmitting, [open, mode]);

  // Memoize handleClose to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    setGroupName('');
    setGroupDescription('');
    setError('');
    setNameError(null);
    setDescriptionError(null);
    setCreatedGroup(null);
    setCopiedCode(null);
    setNotification(null);
    onClose();
  }, [onClose]);

  // Update form values when group changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && group) {
      setGroupName(group.groupName);
      setGroupDescription(group.groupDescription || '');
    } else if (mode === 'create') {
      setGroupName('');
      setGroupDescription('');
    }
    setNameError(null);
    setDescriptionError(null);
    setError(null);
    setCreatedGroup(null);
    setCopiedCode(null);
    setNotification(null);
  }, [mode, group, open]);

  // Subscribe to group updates when in edit mode
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (open && mode === 'edit' && group?.groupId) {
      // Subscribe to group updates
      unsubscribe = groupService.subscribeToGroup(group.groupId, updatedGroup => {
        if (updatedGroup) {
          // Only update if the values are different from what we're currently editing
          if (updatedGroup.groupName !== groupName) {
            setGroupName(updatedGroup.groupName);
          }
          if (updatedGroup.groupDescription !== groupDescription) {
            setGroupDescription(updatedGroup.groupDescription || '');
          }
        } else {
          // Group was deleted or user lost access
          setError('Group no longer exists or you no longer have access to it.');
          handleClose();
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [open, mode, group?.groupId, handleClose]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate group name
    if (!groupName.trim()) {
      setNameError('Group name is required');
      isValid = false;
    } else if (groupName.length > MAX_GROUP_NAME_LENGTH) {
      setNameError(`Group name must be ${MAX_GROUP_NAME_LENGTH} characters or less`);
      isValid = false;
    } else {
      setNameError(null);
    }

    // Validate group description
    if (groupDescription.length > MAX_GROUP_DESCRIPTION_LENGTH) {
      setDescriptionError(`Description must be ${MAX_GROUP_DESCRIPTION_LENGTH} characters or less`);
      isValid = false;
    } else {
      setDescriptionError(null);
    }

    return isValid;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setGroupName(newName);

    // Clear name error if the input is now valid
    if (nameError && newName.trim() && newName.length <= MAX_GROUP_NAME_LENGTH) {
      setNameError(null);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setGroupDescription(newDescription);

    // Clear description error if the input is now valid
    if (descriptionError && newDescription.length <= MAX_GROUP_DESCRIPTION_LENGTH) {
      setDescriptionError(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (mode === 'create' && user) {
        // Create the group
        const newGroup = await groupService.createGroup(groupName, groupDescription, user);

        // Store the created group info for display
        setCreatedGroup({ groupId: newGroup.groupId, joinCode: newGroup.joinCode });

        // Show success notification
        setNotification({
          message: 'Group created successfully',
          type: 'success',
        });

        // Don't call onSubmit or close the dialog yet - let the user see the success message and copy the join code
        // The real-time subscription will handle updating the UI
      } else if (mode === 'edit' && group) {
        // Create the updated group object
        const updatedGroup: Group = {
          ...group,
          groupName,
          groupDescription,
        };

        // Update the group in the database
        await groupService.updateGroup(group.groupId, {
          groupName,
          groupDescription,
        });

        // Notify parent of the update for immediate local state update
        onSubmit(updatedGroup);

        // Show success notification
        setNotification({
          message: 'Group updated successfully',
          type: 'success',
        });

        // Close the dialog
        onClose();
      }
    } catch (err) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} group:`, err);
      setError(`Failed to ${mode} group. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    // If we have a created group, pass it to the parent component
    if (createdGroup) {
      // Create a minimal group object with the necessary information
      const newGroup: Group = {
        groupId: createdGroup.groupId,
        groupName,
        groupDescription,
        createdBy: user.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        joinCode: createdGroup.joinCode,
        userRole: GroupMemberRole.ADMIN, // The creator is always an admin
      };

      // Notify parent of the new group for immediate local state update
      onSubmit(newGroup);
    }

    // Close the dialog and reset state
    handleClose();

    // Notify parent component that the dialog is closed
    onClose();
  };

  const handleCopyJoinCode = async (joinCode: string) => {
    const success = await copyToClipboard(joinCode);
    if (success) {
      setCopiedCode(joinCode);
      setNotification({
        message: 'Join code copied to clipboard',
        type: 'success',
      });
      setTimeout(() => setCopiedCode(null), 1000); // Reset after 1 second
    } else {
      setNotification({
        message: 'Failed to copy join code',
        type: 'error',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const isCreateSuccess = mode === 'create' && createdGroup !== null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{mode === 'create' ? 'Create New Group' : 'Edit Group'}</DialogTitle>
        <DialogContent>
          {isCreateSuccess ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Group Created Successfully!
              </Typography>
              <Typography variant="body1" paragraph>
                Share this join code with others to let them join your group:
              </Typography>
              <Chip
                label={createdGroup.joinCode}
                sx={{ fontSize: '1.2rem', py: 1, px: 2, mb: 2, cursor: 'pointer' }}
                onClick={() => handleCopyJoinCode(createdGroup.joinCode)}
                icon={<ContentCopyIcon />}
                color={copiedCode === createdGroup.joinCode ? 'success' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary">
                You can always find this code in the group details.
              </Typography>
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                autoFocus
                margin="dense"
                id="groupName"
                label="Group Name"
                type="text"
                fullWidth
                variant="outlined"
                value={groupName}
                onChange={handleNameChange}
                disabled={displaySubmitting}
                required
                error={!!nameError}
                helperText={nameError || `${groupName.length}/${MAX_GROUP_NAME_LENGTH}`}
              />
              <TextField
                margin="dense"
                id="groupDescription"
                label="Group Description"
                type="text"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={groupDescription}
                onChange={handleDescriptionChange}
                disabled={displaySubmitting}
                error={!!descriptionError}
                helperText={
                  descriptionError || `${groupDescription.length}/${MAX_GROUP_DESCRIPTION_LENGTH}`
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {isCreateSuccess ? (
            <Button onClick={handleSuccessClose} color="primary">
              Done
            </Button>
          ) : (
            <>
              <Button onClick={handleClose} disabled={displaySubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                color="primary"
                variant="contained"
                disabled={displaySubmitting || !!nameError || !!descriptionError}
                startIcon={displaySubmitting ? <CircularProgress size={20} /> : null}
              >
                {displaySubmitting
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Updating...'
                  : mode === 'create'
                  ? 'Create Group'
                  : 'Update Group'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

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
