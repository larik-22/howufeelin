import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Paper,
  Button,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { GroupMemberRole } from '@/services/groupService';

interface GroupDetailsProps {
  groupName: string;
  groupDescription: string;
  memberCount: number;
  joinCode: string;
  userRole?: GroupMemberRole;
  onCopyJoinCode: (code: string) => void;
  copiedCode: string | null;
  getRoleLabel: (role?: GroupMemberRole) => string;
  getRoleColor: (role?: GroupMemberRole) => 'primary' | 'secondary' | 'default';
}

export const GroupDetails = ({
  groupDescription,
  memberCount,
  joinCode,
  userRole,
  onCopyJoinCode,
  copiedCode,
  getRoleLabel,
  getRoleColor,
}: GroupDetailsProps) => {
  return (
    <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Group Details</Typography>
          </Box>
          <Chip
            label={getRoleLabel(userRole)}
            color={getRoleColor(userRole)}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" sx={{ mb: 2 }}>
          {groupDescription || 'No description provided.'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PeopleIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
          <Typography variant="body2">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Typography>
          <AvatarGroup max={4} sx={{ ml: 2 }}>
            <Avatar alt="John" src="/static/images/avatar/1.jpg" />
            <Avatar alt="Jane" src="/static/images/avatar/2.jpg" />
            <Avatar alt="Bob" src="/static/images/avatar/3.jpg" />
            <Avatar alt="Alice" src="/static/images/avatar/4.jpg" />
            <Avatar alt="Charlie" src="/static/images/avatar/5.jpg" />
          </AvatarGroup>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: copiedCode === joinCode ? 'action.selected' : 'background.paper',
              borderRadius: 2,
              borderColor: 'primary.main',
              width: '100%',
              maxWidth: { xs: '100%', sm: 300 },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {joinCode}
            </Typography>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => onCopyJoinCode(joinCode)}
              variant="text"
              color="primary"
              sx={{ ml: 1 }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Copy</Box>
            </Button>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};
