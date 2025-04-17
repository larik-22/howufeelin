import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { Group } from '@/types/Group';
import { GroupPermission } from '@/hooks/useGroupPermissions';

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
}: GroupCardProps) {
  const isAdmin = group.userRole === 'admin';
  const isModerator = group.userRole === 'moderator';
  const canEdit = isAdmin || isModerator;
  const canDelete = isAdmin;

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
        transition: 'transform 0.2s, box-shadow 0.2s',
        opacity: isDeleting ? 0.7 : 1,
        '&:hover': {
          transform: isDeleting ? 'none' : 'translateY(-4px)',
          boxShadow: isDeleting ? 1 : 4,
        },
      }}
      onClick={() => !isDeleting && onNavigateToDetail(group.groupId)}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
          <GroupIcon
            sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}
          />
          <Typography
            variant="h6"
            component="h3"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            {group.groupName}
            {isDeleting && <CircularProgress size={16} sx={{ ml: 1, display: 'inline-block' }} />}
          </Typography>
          {canEdit && !isDeleting && (
            <Tooltip title="Edit Group">
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation(); // Prevent card click when clicking edit button
                  onEdit(group);
                }}
                sx={{ ml: 1 }}
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
                  e.stopPropagation(); // Prevent card click when clicking delete button
                  onDelete(group);
                }}
                sx={{ ml: 1 }}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {truncateDescription(group.groupDescription)}
          </Typography>
          {group.groupDescription.length > DESCRIPTION_MAX_LENGTH && (
            <Button
              size="small"
              onClick={e => {
                e.stopPropagation(); // Prevent card click when clicking show more/less
                onToggleDescription(group.groupId);
              }}
              sx={{
                mt: 0.5,
                p: 0,
                minWidth: 'auto',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
              }}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <PeopleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {memberCount > 0 ? memberCount : '...'} {memberCount === 1 ? 'member' : 'members'}
          </Typography>
          <Chip
            size="small"
            label={getRoleLabel(group.userRole || '')}
            sx={{
              ml: 1,
              height: { xs: 20, sm: 24 },
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
            }}
            color={getRoleColor(group.userRole || '')}
          />
        </Box>
        <Chip
          label={`Join Code: ${group.joinCode}`}
          size="small"
          variant="outlined"
          sx={{
            mt: 1,
            height: { xs: 24, sm: 28 },
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
          }}
          onClick={e => {
            e.stopPropagation(); // Prevent card click when clicking join code
            onCopyJoinCode(group.joinCode);
          }}
          icon={<ContentCopyIcon fontSize="small" />}
          color={copiedCode === group.joinCode ? 'success' : 'default'}
        />
      </CardContent>
      <CardActions sx={{ p: { xs: 1, sm: 2 }, pt: 0 }}>
        {hasPermission(group, GroupPermission.MANAGE_MEMBERS) && !isDeleting ? (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            startIcon={<ManageAccountsIcon />}
            onClick={e => {
              e.stopPropagation(); // Prevent card click when clicking manage members
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
      </CardActions>
    </Card>
  );
}
