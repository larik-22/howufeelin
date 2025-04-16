import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';

interface EditGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onGroupUpdated: () => void;
  group: Group;
}

export default function EditGroupDialog({
  open,
  onClose,
  onGroupUpdated,
  group,
}: EditGroupDialogProps) {
  const [groupName, setGroupName] = useState(group.groupName);
  const [groupDescription, setGroupDescription] = useState(group.groupDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form values when group changes
  useEffect(() => {
    setGroupName(group.groupName);
    setGroupDescription(group.groupDescription);
  }, [group]);

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await groupService.updateGroup(group.groupId, {
        groupName,
        groupDescription,
      });

      onGroupUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating group:', err);
      setError('Failed to update group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName(group.groupName);
    setGroupDescription(group.groupDescription);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Group</DialogTitle>
      <DialogContent>
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
          onChange={e => setGroupName(e.target.value)}
          disabled={loading}
          required
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
          onChange={e => setGroupDescription(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdateGroup}
          color="primary"
          variant="contained"
          disabled={loading || !groupName.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Updating...' : 'Update Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
