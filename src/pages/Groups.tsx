import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';

// Placeholder data
const placeholderGroups = [
  {
    groupId: '1',
    groupName: 'Team Alpha',
    groupDescription: 'Main development team',
    joinCode: 'ALPHA123',
  },
  {
    groupId: '2',
    groupName: 'Team Beta',
    groupDescription: 'QA and testing team',
    joinCode: 'BETA456',
  },
];

export default function Groups() {
  const auth = useContext(AuthContext);

  if (!auth || !auth.firebaseUser) return null;

  return (
    <div>
      <Typography variant="h5" component="h2" gutterBottom>
        My Groups
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Group Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Join Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {placeholderGroups.map(group => (
              <TableRow key={group.groupId}>
                <TableCell>{group.groupName}</TableCell>
                <TableCell>{group.groupDescription}</TableCell>
                <TableCell>{group.joinCode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
