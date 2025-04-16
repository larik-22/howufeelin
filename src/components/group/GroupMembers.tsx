import { Box, Card, CardContent, Typography, Chip, Divider, Paper, Avatar } from '@mui/material';
import { GroupMemberRole } from '@/services/groupService';

interface Member {
  name: string;
  role: GroupMemberRole;
  avatar: string;
}

interface GroupMembersProps {
  members: Member[];
  getRoleLabel: (role: GroupMemberRole) => string;
  getRoleColor: (role: GroupMemberRole) => 'primary' | 'secondary' | 'default';
}

export const GroupMembers = ({ members, getRoleLabel, getRoleColor }: GroupMembersProps) => {
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
              <Avatar src={member.avatar} alt={member.name} sx={{ width: 50, height: 50, mr: 2 }} />
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
