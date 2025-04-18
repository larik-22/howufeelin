import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Group } from '@/types/Group';
import { GroupPermission } from '@/hooks/useGroupPermissions';
import { GroupMemberRole } from '@/types/GroupMemberRole';

// Constants
const DESCRIPTION_MAX_LENGTH = 100;

interface GroupCardProps {
  group: Group;
  memberCount: number;
  isExpanded: boolean;
  isDeleting: boolean;
  copiedCode: string | null;
  hasPermission: (group: Group, permission: GroupPermission) => boolean;
  getRoleColor: (
    role: string
  ) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  getRoleLabel: (role: string) => string;
  onNavigateToDetail: (groupId: string) => void;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
  onCopyJoinCode: (joinCode: string) => void;
  onToggleDescription: (groupId: string) => void;
  onManageMembers: (group: Group) => void;
  onLeaveGroup?: (group: Group) => void;
}

export default function GroupCard({
  group,
  memberCount,
  isExpanded,
  isDeleting,
  copiedCode,
  hasPermission,
  getRoleColor,
  getRoleLabel,
  onNavigateToDetail,
  onEdit,
  onDelete,
  onCopyJoinCode,
  onToggleDescription,
  onManageMembers,
  onLeaveGroup,
}: GroupCardProps) {
  const isAdmin = group.userRole === GroupMemberRole.ADMIN;
  const isModerator = group.userRole === GroupMemberRole.MODERATOR;
  const canEdit = isAdmin || isModerator;
  const canDelete = isAdmin;
  const canLeave = !isAdmin && onLeaveGroup !== undefined;

  const truncateDescription = (description: string) => {
    if (description.length <= DESCRIPTION_MAX_LENGTH) {
      return description;
    }
    return isExpanded ? description : `${description.substring(0, DESCRIPTION_MAX_LENGTH)}...`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        opacity: isDeleting ? 0.7 : 1,
        borderRadius: 2,
        boxShadow: isDeleting ? 1 : '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          transform: isDeleting ? 'none' : 'translateY(-4px)',
          boxShadow: isDeleting ? 1 : '0 4px 12px rgba(0,0,0,0.12)',
        },
      }}
      onClick={() => !isDeleting && onNavigateToDetail(group.groupId)}
    >
      <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top section with group name and role */}
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GroupIcon sx={{ color: 'primary.main', fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
            <Box>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.groupName}
                {isDeleting && (
                  <CircularProgress size={16} sx={{ ml: 1, display: 'inline-block' }} />
                )}
              </Typography>
              <Chip
                size="small"
                label={getRoleLabel(group.userRole || '')}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  mt: 0.5,
                }}
                color={getRoleColor(group.userRole || '')}
              />
            </Box>
          </Box>

          <Stack direction="row" spacing={0.5}>
            {canEdit && !isDeleting && (
              <Tooltip title="Edit Group">
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(group);
                  }}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && !isDeleting && (
              <Tooltip title="Delete Group">
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(group);
                  }}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'error.main' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canLeave && !isDeleting && (
              <Tooltip title="Leave Group">
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onLeaveGroup!(group);
                  }}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'error.main' },
                  }}
                >
                  <ExitToAppIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Middle section with description */}
        {group.groupDescription && (
          <Box sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                lineHeight: 1.5,
                mb: group.groupDescription.length > DESCRIPTION_MAX_LENGTH ? 1 : 0,
              }}
            >
              {truncateDescription(group.groupDescription)}
            </Typography>
            {group.groupDescription.length > DESCRIPTION_MAX_LENGTH && (
              <Button
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onToggleDescription(group.groupId);
                }}
                sx={{
                  p: 0,
                  minWidth: 'auto',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
                endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </Box>
        )}

        {/* Bottom section with member count and join code */}
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {memberCount > 0 ? memberCount : '...'} {memberCount === 1 ? 'member' : 'members'}
            </Typography>

            {hasPermission(group, GroupPermission.MANAGE_MEMBERS) && !isDeleting ? (
              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<ManageAccountsIcon />}
                onClick={e => {
                  e.stopPropagation();
                  onManageMembers(group);
                }}
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(143, 197, 163, 0.08)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  },
                }}
              >
                Manage Members
              </Button>
            ) : null}
          </Box>

          <Chip
            label={`Join Code: ${group.joinCode}`}
            size="small"
            variant="outlined"
            sx={{
              height: { xs: 24, sm: 28 },
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              borderColor: copiedCode === group.joinCode ? 'success.main' : 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={e => {
              e.stopPropagation();
              onCopyJoinCode(group.joinCode);
            }}
            icon={<ContentCopyIcon fontSize="small" />}
            color={copiedCode === group.joinCode ? 'success' : 'default'}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
