import { useContext, useState, useEffect, useCallback } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import CreateGroupDialog from '@/components/CreateGroupDialog';
import EditGroupDialog from '@/components/EditGroupDialog';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';

export default function Groups() {
  const auth = useContext(AuthContext);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);

  // Use useCallback to memoize the fetchGroups function
  const fetchGroups = useCallback(async () => {
    if (!auth?.myUser?.userId) return;

    try {
      setLoading(true);
      setError(null);
      const userGroups = await groupService.getUserGroups(auth.myUser.userId);
      setGroups(userGroups);
      setLastFetchedUserId(auth.myUser.userId);

      // Fetch member counts for all groups in a single query
      if (userGroups.length > 0) {
        const groupIds = userGroups.map(group => group.groupId);
        const counts = await groupService.getGroupMemberCounts(groupIds);
        setMemberCounts(counts);
      } else {
        setMemberCounts({});
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [auth?.myUser?.userId]);

  // Only fetch groups when the component mounts or when the user ID changes
  useEffect(() => {
    if (auth?.myUser?.userId && auth.myUser.userId !== lastFetchedUserId) {
      fetchGroups();
    }
  }, [auth?.myUser?.userId, fetchGroups, lastFetchedUserId]);

  const handleCreateGroup = () => {
    setIsCreateDialogOpen(true);
  };

  const handleGroupCreated = () => {
    // Clear the cache for the current user before fetching
    if (auth?.myUser?.userId) {
      groupService.clearUserGroupsCache(auth.myUser.userId);
    }
    fetchGroups();
    setIsCreateDialogOpen(false);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsEditDialogOpen(true);
  };

  const handleGroupUpdated = () => {
    // Clear the cache for the current user before fetching
    if (auth?.myUser?.userId) {
      groupService.clearUserGroupsCache(auth.myUser.userId);
    }
    fetchGroups();
  };

  const handleCopyJoinCode = async (joinCode: string) => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedCode(joinCode);
      setTimeout(() => setCopiedCode(null), 1000); // Reset after 1 seconds
    } catch (err) {
      console.error('Failed to copy join code:', err);
    }
  };

  if (!auth || !auth.firebaseUser || !auth.myUser) return null;

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          My Groups
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateGroup}
        >
          Create Group
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            You haven't joined any groups yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new group or ask someone to share their group's join code with you
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateGroup}
          >
            Create Your First Group
          </Button>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          {groups.map(group => (
            <Card
              key={group.groupId}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                    {group.groupName}
                  </Typography>
                  <Tooltip title="Edit Group">
                    <IconButton size="small" onClick={() => handleEditGroup(group)} sx={{ ml: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {group.groupDescription}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {memberCounts[group.groupId] || 0}{' '}
                    {memberCounts[group.groupId] === 1 ? 'member' : 'members'}
                  </Typography>
                </Box>
                <Chip
                  label={`Join Code: ${group.joinCode}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => handleCopyJoinCode(group.joinCode)}
                  icon={<ContentCopyIcon />}
                  color={copiedCode === group.joinCode ? 'success' : 'default'}
                />
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View Details
                </Button>
                <Button size="small" color="primary">
                  Manage Members
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <CreateGroupDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onGroupCreated={handleGroupCreated}
        user={auth.myUser}
      />

      {selectedGroup && (
        <EditGroupDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onGroupUpdated={handleGroupUpdated}
          group={selectedGroup}
        />
      )}
    </Box>
  );
}
