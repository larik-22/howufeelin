import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Group } from '@/types/Group';
import { GroupMemberRole } from '@/types/GroupMemberRole';

interface GroupHeaderProps {
  group: Group;
  onBack: () => void;
  onLeave: () => void;
  currentUserId?: string;
}

export const GroupHeader = ({ group, onBack, onLeave, currentUserId }: GroupHeaderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Only show leave button if user is not an admin
  const canLeaveGroup =
    group.userRole !== GroupMemberRole.ADMIN || group.createdBy !== currentUserId;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: { xs: 2, sm: 3 },
        position: 'relative',
        width: '100%',
        px: { xs: 0, sm: 1 },
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        variant="text"
        sx={{
          position: { xs: 'static', sm: 'absolute' },
          left: 0,
          minWidth: { xs: '36px', sm: 'auto' },
          p: { xs: 0.5, sm: 1 },
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
        aria-label="Go back"
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
          fontSize: { xs: '1.1rem', sm: '1.5rem' },
          px: { xs: 1, sm: 8 },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: { xs: 'calc(100% - 80px)', sm: '100%' },
          mx: 'auto',
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
              p: { xs: 0.5, sm: 1 },
              '&:hover': {
                bgcolor: 'error.light',
                color: 'white',
              },
            }}
            aria-label="Leave group"
          >
            <ExitToAppIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
