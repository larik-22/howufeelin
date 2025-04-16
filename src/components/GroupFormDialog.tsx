import { useState, useEffect } from 'react';
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
import { copyToClipboard } from '@/utils/clipboard';

// Validation constants
export const MAX_GROUP_NAME_LENGTH = 50;
export const MAX_GROUP_DESCRIPTION_LENGTH = 200;

export interface GroupFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ groupId: string; joinCode: string } | null>(
    null
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Update form values when group changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && group) {
      setGroupName(group.groupName);
      setGroupDescription(group.groupDescription);
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
  }, [mode, group]);

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
      setLoading(true);
      setError(null);

      if (mode === 'create' && user) {
        const newGroup = await groupService.createGroup(groupName, groupDescription, user);
        setCreatedGroup({ groupId: newGroup.groupId, joinCode: newGroup.joinCode });
        // Don't close the dialog immediately for create mode
      } else if (mode === 'edit' && group) {
        await groupService.updateGroup(group.groupId, {
          groupName,
          groupDescription,
        });
        // For edit mode, close immediately and notify parent
        onSubmit();
        onClose();
      }
    } catch (err) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} group:`, err);
      setError(`Failed to ${mode} group. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (mode === 'edit' && group) {
      setGroupName(group.groupName);
      setGroupDescription(group.groupDescription);
    } else {
      setGroupName('');
      setGroupDescription('');
    }
    setError(null);
    setNameError(null);
    setDescriptionError(null);
    setCreatedGroup(null);
    setCopiedCode(null);
    setNotification(null);
    onClose();
  };

  const handleSuccessClose = () => {
    onSubmit(); // Notify parent of success
    handleClose(); // Reset state and close dialog
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
                disabled={loading}
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
                disabled={loading}
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
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                color="primary"
                variant="contained"
                disabled={loading || !!nameError || !!descriptionError}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading
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
