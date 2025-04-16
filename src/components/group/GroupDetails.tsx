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
  Skeleton,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { GroupMemberRole } from '@/services/groupService';
import { Group } from '@/types/Group';
import { GroupMember } from '@/types/GroupMember';

interface GroupDetailsProps {
  group: Group;
  memberCount: number;
  onCopyJoinCode: (code: string) => void;
  copiedCode: string | null;
  getRoleLabel: (role?: GroupMemberRole) => string;
  getRoleColor: (role?: GroupMemberRole) => 'primary' | 'secondary' | 'default';
  loading?: boolean;
  groupMembers?: GroupMember[];
}

export const GroupDetails = ({
  group,
  memberCount,
  onCopyJoinCode,
  copiedCode,
  getRoleLabel,
  getRoleColor,
  loading = false,
  groupMembers = [],
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
            label={getRoleLabel(group.userRole)}
            color={getRoleColor(group.userRole)}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" sx={{ mb: 2 }}>
          {group.groupDescription || 'No description provided.'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PeopleIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
          <Typography variant="body2">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', ml: 2 }}>
              <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
              <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
              <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
              <Skeleton variant="circular" width={30} height={30} />
            </Box>
          ) : (
            <AvatarGroup max={4} sx={{ ml: 2 }}>
              {groupMembers.map((member: GroupMember, index: number) => (
                <Avatar
                  key={index}
                  alt={member.displayName}
                  src={
                    member.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      member.displayName
                    )}&background=random`
                  }
                />
              ))}
            </AvatarGroup>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor:
                copiedCode === group.joinCode ? 'action.selected' : 'background.paper',
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
              {group.joinCode}
            </Typography>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => onCopyJoinCode(group.joinCode)}
            >
              {copiedCode === group.joinCode ? 'Copied!' : 'Copy'}
            </Button>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};
