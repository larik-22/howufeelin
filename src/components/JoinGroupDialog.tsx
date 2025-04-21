import { useState } from 'react';
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
} from '@mui/material';
import { groupService } from '@/services/groupService';
import { MyUser } from '@/types/MyUser';
import { useLoadingState } from '@/hooks/useLoadingState';

interface JoinGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (groupName: string) => void;
  user: MyUser;
}

const JOIN_CODE_LENGTH = 6;

export default function JoinGroupDialog({ open, onClose, onSuccess, user }: JoinGroupDialogProps) {
  const [joinCode, setJoinCode] = useState<string[]>(Array(JOIN_CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use our custom loading state hook
  const displayLoading = useLoadingState(isLoading, [open]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newJoinCode = [...joinCode];
    newJoinCode[index] = value.toUpperCase(); // Convert to uppercase
    setJoinCode(newJoinCode);

    // Auto-focus next input
    if (value && index < JOIN_CODE_LENGTH - 1) {
      const nextInput = document.getElementById(`join-code-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !joinCode[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      const prevInput = document.getElementById(`join-code-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, JOIN_CODE_LENGTH).toUpperCase();
    const newJoinCode = Array(JOIN_CODE_LENGTH).fill('');
    pastedData.split('').forEach((char, index) => {
      if (index < JOIN_CODE_LENGTH) {
        newJoinCode[index] = char;
      }
    });
    setJoinCode(newJoinCode);
  };

  const handleSubmit = async () => {
    const code = joinCode.join('');
    if (code.length !== JOIN_CODE_LENGTH) {
      setError('Please enter the complete join code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const group = await groupService.joinGroup(code, user);

      // With real-time subscriptions, we don't need to manually refresh the groups list
      // Just notify the parent component of success and close the dialog
      onSuccess(group.groupName);
      onClose();
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Invalid join code or you are already a member of this group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setJoinCode(Array(JOIN_CODE_LENGTH).fill(''));
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Join a Group</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            Enter the 6-character join code provided by the group administrator:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              my: 3,
            }}
            onPaste={handlePaste}
          >
            {joinCode.map((digit, index) => (
              <input
                key={index}
                id={`join-code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                style={{
                  width: '40px',
                  height: '48px',
                  fontSize: '24px',
                  textAlign: 'center',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                }}
              />
            ))}
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={displayLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={displayLoading || joinCode.some(char => !char)}
          startIcon={displayLoading ? <CircularProgress size={20} /> : null}
        >
          {displayLoading ? 'Joining...' : 'Join Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
