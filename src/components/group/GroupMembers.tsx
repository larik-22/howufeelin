import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Paper,
  Avatar,
  Skeleton,
} from '@mui/material';
import { GroupMemberRole } from '@/services/groupService';
import { useState, useEffect } from 'react';
import PersonIcon from '@mui/icons-material/Person';

interface Member {
  name: string;
  role: GroupMemberRole;
  avatar: string;
  userId: string;
  photoURL?: string;
}

interface GroupMembersProps {
  members: Member[];
  getRoleLabel: (role: GroupMemberRole) => string;
  getRoleColor: (role: GroupMemberRole) => 'primary' | 'secondary' | 'default';
  loading?: boolean;
}

export const GroupMembers = ({
  members,
  getRoleLabel,
  getRoleColor,
  loading = false,
}: GroupMembersProps) => {
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserPhotos = async () => {
      if (members.length === 0) {
        setLoadingPhotos(false);
        return;
      }

      try {
        const photoMap: Record<string, string> = {};

        // Fetch photos for each member
        for (const member of members) {
          // Use photoURL if available, otherwise use the avatar or fallback to UI Avatars
          if (member.photoURL) {
            photoMap[member.userId] = member.photoURL;
          } else if (member.avatar) {
            photoMap[member.userId] = member.avatar;
          } else {
            // Fallback to UI Avatars
            photoMap[member.userId] = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              member.name
            )}&background=random`;
          }
        }

        setUserPhotos(photoMap);
      } catch (error) {
        console.error('Error fetching user photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchUserPhotos();
  }, [members]);

  if (loading) {
    return (
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={1} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                }}
              >
                <Skeleton variant="circular" width={50} height={50} sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                </Box>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Group Members
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {members.map((member, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 2,
              }}
            >
              {loadingPhotos ? (
                <Skeleton variant="circular" width={50} height={50} sx={{ mr: 2 }} />
              ) : (
                <Avatar
                  src={userPhotos[member.userId]}
                  alt={member.name}
                  sx={{ width: 50, height: 50, mr: 2 }}
                >
                  <PersonIcon />
                </Avatar>
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {member.name}
                </Typography>
                <Chip
                  label={getRoleLabel(member.role)}
                  size="small"
                  color={getRoleColor(member.role)}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
