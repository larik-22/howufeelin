import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Group } from '@/types/Group';
import { GroupMemberRole } from '@/services/groupService';

interface GroupHeaderProps {
  group: Group;
  onBack: () => void;
  onLeave: () => void;
  currentUserId?: string;
}

export const GroupHeader = ({ group, onBack, onLeave, currentUserId }: GroupHeaderProps) => {
  // Only show leave button if user is not an admin
  const canLeaveGroup =
    group.userRole !== GroupMemberRole.ADMIN || group.createdBy !== currentUserId;

  console.log('currentUserId', currentUserId);
  console.log('group.createdBy', group.createdBy);
  console.log('group.userRole', group.userRole);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 3,
        position: 'relative',
        width: '100%',
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        variant="text"
        sx={{
          position: { xs: 'static', sm: 'absolute' },
          left: 0,
          minWidth: { xs: '40px', sm: 'auto' },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Back</Box>
      </Button>

      <Typography
        variant="h5"
        component="h1"
        sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          width: '100%',
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          px: { xs: 2, sm: 8 },
        }}
      >
        {group.groupName}
      </Typography>

      {canLeaveGroup && (
        <Tooltip title="Leave Group">
          <IconButton
            color="error"
            onClick={onLeave}
            sx={{
              position: { xs: 'static', sm: 'absolute' },
              right: 0,
              '&:hover': {
                bgcolor: 'error.light',
                color: 'white',
              },
            }}
          >
            <ExitToAppIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
