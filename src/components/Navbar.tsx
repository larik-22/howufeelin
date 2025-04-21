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
  useTheme,
  Divider,
  ListItemIcon,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AuthContext from '@/contexts/auth/authContext';
import { isRizel } from '@/utils/specialUsers';
import RizelEasterEgg from './RizelEasterEgg';

export default function Navbar() {
  const theme = useTheme();
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
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Typography
            variant="h6"
            component={Link}
            to="/dashboard"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              letterSpacing: '-0.01em',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: theme.palette.primary.main,
              },
            }}
          >
            HowUFeel
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isRizelUser && (
              <Box sx={{ position: 'relative', zIndex: theme.zIndex.modal }}>
                {!heartExpanded && (
                  <Tooltip title="Click for a surprise!">
                    <IconButton
                      onClick={() => setHeartExpanded(!heartExpanded)}
                      sx={{
                        color: theme.palette.primary.main,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)',
                        },
                      }}
                    >
                      <FavoriteIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {heartExpanded && (
                  <IconButton
                    onClick={() => setHeartExpanded(!heartExpanded)}
                    sx={{
                      color: theme.palette.primary.main,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                      },
                    }}
                  >
                    <FavoriteIcon />
                  </IconButton>
                )}
                <RizelEasterEgg open={heartExpanded} onClose={() => setHeartExpanded(false)} />
              </Box>
            )}

            <Tooltip title="Analytics">
              <IconButton
                component={Link}
                to="/analytics"
                sx={{
                  color: theme.palette.text.secondary,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <BarChartIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Account menu">
              <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                  ml: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                {userPhoto ? (
                  <Avatar
                    src={userPhoto}
                    alt="Profile"
                    sx={{
                      width: 32,
                      height: 32,
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 32,
                      height: 32,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      borderRadius: '50%',
                    }}
                  >
                    {userInitial}
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>

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
                  minWidth: 200,
                  borderRadius: 3,
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
                <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {auth.myUser?.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {auth.firebaseUser.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleSignOutClick}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="signout-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: { xs: '90%', sm: 400 },
          },
        }}
      >
        <DialogTitle id="signout-dialog-title" sx={{ pb: 1 }}>
          Sign Out
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to sign out? You will need to sign in again to access your
            account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDialogClose}
            variant="outlined"
            color="inherit"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignOut}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              px: 3,
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
