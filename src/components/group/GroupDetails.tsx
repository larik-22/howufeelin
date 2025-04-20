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
  IconButton,
  Tooltip,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import { GroupMemberRole } from '@/types/GroupMemberRole';
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
  onEdit?: () => void;
  canEdit?: boolean;
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
  onEdit,
  canEdit = false,
}: GroupDetailsProps) => {
  return (
    <Card
      sx={{
        mb: { xs: 2, sm: 3 },
        boxShadow: { xs: 1, sm: 3 },
        borderRadius: { xs: 1, sm: 2 },
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: { xs: 1.5, sm: 2 },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon
              sx={{
                mr: 1,
                color: 'primary.main',
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
              }}
            />
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Group Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {canEdit && onEdit && (
              <Tooltip title="Edit Group">
                <IconButton
                  color="primary"
                  onClick={onEdit}
                  sx={{
                    backgroundColor: 'rgba(143, 197, 163, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(143, 197, 163, 0.15)',
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            <Chip
              label={getRoleLabel(group.userRole)}
              color={getRoleColor(group.userRole)}
              size="small"
              sx={{
                fontWeight: 'bold',
                height: { xs: 24, sm: 28 },
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
              }}
            />
          </Box>
        </Box>
        <Divider sx={{ mb: { xs: 1.5, sm: 2 } }} />
        <Typography
          variant="body1"
          sx={{
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {group.groupDescription || 'No description provided.'}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: { xs: 1.5, sm: 2 },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PeopleIcon
              sx={{
                mr: 1,
                fontSize: { xs: '1rem', sm: '1.2rem' },
                color: 'primary.main',
              }}
            />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Typography>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
          ) : (
            <AvatarGroup
              max={4}
              sx={{
                ml: { xs: 0, sm: 2 },
                mt: { xs: 1, sm: 0 },
                '& .MuiAvatar-root': {
                  width: { xs: 24, sm: 30 },
                  height: { xs: 24, sm: 30 },
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                },
              }}
            >
              {groupMembers.map((member: GroupMember, index: number) => {
                // Get the user's initial for the fallback avatar
                const userInitial = member.displayName?.[0]?.toUpperCase() || 'U';

                return (
                  <Avatar
                    key={index}
                    alt={member.displayName}
                    src={member.photoURL}
                    sx={{ bgcolor: 'primary.main' }}
                  >
                    {userInitial}
                  </Avatar>
                );
              })}
            </AvatarGroup>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1, sm: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor:
                copiedCode === group.joinCode ? 'action.selected' : 'background.paper',
              borderRadius: { xs: 1, sm: 2 },
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
                fontSize: { xs: '0.75rem', sm: '1rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: '60%', sm: '70%' },
              }}
            >
              {group.joinCode}
            </Typography>
            <Button
              size="small"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={() => onCopyJoinCode(group.joinCode)}
              sx={{
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
              }}
            >
              {copiedCode === group.joinCode ? 'Copied!' : 'Copy'}
            </Button>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};
