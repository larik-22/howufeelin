import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Group } from '@/types/Group';
import { groupService } from '@/services/groupService';

interface LeaveGroupDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  userId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function LeaveGroupDialog({
  open,
  onClose,
  group,
  userId,
  onSuccess,
  onError,
}: LeaveGroupDialogProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLeaveGroup = async () => {
    if (!group.groupId || !userId) return;

    try {
      setIsLeaving(true);
      await groupService.removeMemberFromGroup(group.groupId, userId);

      // Call the success callback first
      onSuccess();

      // Then close the dialog
      onClose();
    } catch (error) {
      console.error('Error leaving group:', error);
      onError('Failed to leave the group');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isLeaving ? onClose : undefined}
      aria-labelledby="leave-group-dialog-title"
      aria-describedby="leave-group-dialog-description"
      disableEscapeKeyDown={isLeaving}
      fullScreen={isMobile}
    >
      <DialogTitle id="leave-group-dialog-title">Leave Group</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {isLeaving ? <CircularProgress size={24} sx={{ mr: 2 }} /> : null}
          <Box>
            Are you sure you want to leave "{group.groupName}"? You will need to be invited again to
            rejoin.
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLeaving} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleLeaveGroup}
          color="error"
          variant="contained"
          disabled={isLeaving}
          startIcon={isLeaving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLeaving ? 'Leaving...' : 'Leave Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
