import { useState } from 'react';
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
} from '@mui/material';
import { groupService } from '@/services/groupService';
import { MyUser } from '@/types/MyUser';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
  user: MyUser;
}

export default function CreateGroupDialog({
  open,
  onClose,
  onGroupCreated,
  user,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ groupId: string; joinCode: string } | null>(
    null
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const group = await groupService.createGroup(groupName, groupDescription, user);
      setCreatedGroup({ groupId: group.groupId, joinCode: group.joinCode });
      onGroupCreated();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setError(null);
    setCreatedGroup(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        {createdGroup ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Group Created Successfully!
            </Typography>
            <Typography variant="body1" paragraph>
              Share this join code with others to let them join your group:
            </Typography>
            <Chip
              label={createdGroup.joinCode}
              color="primary"
              sx={{ fontSize: '1.2rem', py: 1, px: 2, mb: 2 }}
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
          </>
        )}
      </DialogContent>
      <DialogActions>
        {createdGroup ? (
          <Button onClick={handleClose} color="primary">
            Done
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              color="primary"
              variant="contained"
              disabled={loading || !groupName.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
