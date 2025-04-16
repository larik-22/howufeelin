import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

interface GroupHeaderProps {
  groupName: string;
  onBack: () => void;
  onLeave: () => void;
}

export const GroupHeader = ({ groupName, onBack, onLeave }: GroupHeaderProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 3,
        position: 'relative',
        width: '100%',
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        variant="text"
        sx={{
          position: { xs: 'static', sm: 'absolute' },
          left: 0,
          minWidth: { xs: '40px', sm: 'auto' },
          px: { xs: 1, sm: 2 },
        }}
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
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          px: { xs: 2, sm: 8 },
        }}
      >
        {groupName}
      </Typography>

      <Tooltip title="Leave Group">
        <IconButton
          color="error"
          onClick={onLeave}
          sx={{
            position: { xs: 'static', sm: 'absolute' },
            right: 0,
            '&:hover': {
              bgcolor: 'error.light',
              color: 'white',
            },
          }}
        >
          <ExitToAppIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
