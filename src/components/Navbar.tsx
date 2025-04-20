import { useState } from 'react';
import { Link } from 'react-router';
import { useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AuthContext from '@/contexts/auth/authContext';
import { isRizel } from '@/utils/specialUsers';
import RizelEasterEgg from './RizelEasterEgg';

export default function Navbar() {
  const auth = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [heartExpanded, setHeartExpanded] = useState(false);
  const open = Boolean(anchorEl);

  if (!auth?.firebaseUser) return null;

  const userInitial = auth.myUser?.displayName?.[0]?.toUpperCase() || 'U';
  const userPhoto = auth.firebaseUser.photoURL;
  const isRizelUser = isRizel(auth.firebaseUser.email);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOutClick = () => {
    handleClose();
    setOpenDialog(true);
  };

  const handleSignOut = () => {
    auth.signOut();
    setOpenDialog(false);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/dashboard"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 600,
            }}
          >
            HowUFeel
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isRizelUser && (
              <Box sx={{ position: 'relative', mr: 2 }}>
                <Tooltip title="Click for a surprise!">
                  <IconButton
                    onClick={() => setHeartExpanded(!heartExpanded)}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        transition: 'transform 0.2s',
                      },
                    }}
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Tooltip>
                <RizelEasterEgg open={heartExpanded} onClose={() => setHeartExpanded(false)} />
              </Box>
            )}
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              {userPhoto ? (
                <Avatar src={userPhoto} alt="Profile" />
              ) : (
                <Avatar sx={{ bgcolor: 'primary.main' }}>{userInitial}</Avatar>
              )}
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleClose}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" color="text.secondary">
                    {auth.myUser?.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {auth.firebaseUser.email}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleSignOutClick}>Sign Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog open={openDialog} onClose={handleDialogClose} aria-labelledby="signout-dialog-title">
        <DialogTitle id="signout-dialog-title">Are you sure you want to sign out?</DialogTitle>
        <DialogContent>
          <Typography>You will need to sign in again to access your account.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSignOut} color="error" variant="contained">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
