import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import AuthContext from '@/contexts/auth/authContext';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Snackbar,
  Slider,
  TextField,
  IconButton,
  Tooltip,
  Avatar,
  AvatarGroup,
  Fade,
  Zoom,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import { groupService } from '@/services/groupService';
import { Group } from '@/types/Group';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';
import { copyToClipboard } from '@/utils/clipboard';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

// Mock data for user ratings - this would come from your backend
const mockUserRatings = [
  // April 14, 2025
  { userId: 'user1', username: 'John', rating: 8, date: '2025-04-14' },
  { userId: 'user2', username: 'Jane', rating: 6, date: '2025-04-14' },
  { userId: 'user3', username: 'Bob', rating: 9, date: '2025-04-14' },
  { userId: 'user4', username: 'Alice', rating: 7, date: '2025-04-14' },
  { userId: 'user5', username: 'Charlie', rating: 5, date: '2025-04-14' },

  // April 15, 2025
  { userId: 'user1', username: 'John', rating: 7, date: '2025-04-15' },
  { userId: 'user2', username: 'Jane', rating: 8, date: '2025-04-15' },
  { userId: 'user3', username: 'Bob', rating: 5, date: '2025-04-15' },
  { userId: 'user4', username: 'Alice', rating: 9, date: '2025-04-15' },
  { userId: 'user5', username: 'Charlie', rating: 6, date: '2025-04-15' },

  // April 16, 2025 (today)
  { userId: 'user1', username: 'John', rating: 9, date: '2025-04-16' },
  { userId: 'user2', username: 'Jane', rating: 7, date: '2025-04-16' },
  { userId: 'user3', username: 'Bob', rating: 8, date: '2025-04-16' },
  { userId: 'user4', username: 'Alice', rating: 6, date: '2025-04-16' },
  // Charlie hasn't submitted a rating for today yet
];

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { getRoleColor, getRoleLabel } = useGroupPermissions();
  const theme = useTheme();

  // Get the group data from the loader
  const { group: loaderGroup } = useLoaderData() as { group: Group };

  const [group, setGroup] = useState<Group | null>(loaderGroup || null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs('2025-04-16'));
  const [moodRating, setMoodRating] = useState<number>(5);
  const [moodNote, setMoodNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showMoodEmoji, setShowMoodEmoji] = useState<boolean>(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId || !auth?.myUser?.userId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch member count
        const count = await groupService.getGroupMemberCount(groupId);

        // Fetch user's role in this group
        const userGroups = await groupService.getUserGroups(auth.myUser.userId);
        const userGroup = userGroups.find(g => g.groupId === groupId);

        if (!userGroup) {
          setError('You are not a member of this group');
          setLoading(false);
          return;
        }

        // Set group data with user role
        setGroup({
          ...loaderGroup,
          userRole: userGroup.userRole,
        });
        setMemberCount(count);
      } catch (err) {
        console.error('Error fetching group data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, auth?.myUser?.userId, loaderGroup]);

  const handleBackToGroups = () => {
    navigate('/dashboard');
  };

  const handleCopyJoinCode = async (joinCode: string) => {
    const success = await copyToClipboard(joinCode);
    if (success) {
      setCopiedCode(joinCode);
      setNotification({
        message: 'Join code copied to clipboard',
        type: 'success',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
    setCopiedCode(null);
  };

  const handleLeaveGroup = () => {
    // This would be implemented later with a confirmation dialog
    setNotification({
      message: 'Leave group functionality will be implemented soon',
      type: 'info',
    });
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleMoodRatingChange = (_event: Event, newValue: number | number[]) => {
    setMoodRating(newValue as number);
    setShowMoodEmoji(true);
    // Hide emoji after 1.5 seconds
    setTimeout(() => setShowMoodEmoji(false), 1500);
  };

  const handleMoodNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMoodNote(event.target.value);
  };

  const handleSubmitMood = () => {
    // This would be implemented later to save the mood rating
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setNotification({
        message: 'Mood rating submitted successfully',
        type: 'success',
      });
      // Reset form
      setMoodNote('');
    }, 1000);
  };

  // Filter ratings for the selected date
  const getRatingsForDate = (date: string) => {
    return mockUserRatings.filter(rating => rating.date === date);
  };

  // Prepare chart data for the selected date
  const getChartData = () => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const ratings = getRatingsForDate(dateStr);

    return {
      xAxis: [
        {
          data: ratings.map(r => r.username),
          scaleType: 'band' as const,
        },
      ],
      series: [
        {
          data: ratings.map(r => r.rating),
          color: theme.palette.primary.main,
        },
      ],
    };
  };

  // Get emoji based on rating
  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return <SentimentVeryDissatisfiedIcon fontSize="large" color="error" />;
    if (rating <= 4) return <SentimentDissatisfiedIcon fontSize="large" color="warning" />;
    if (rating <= 6) return <SentimentSatisfiedIcon fontSize="large" color="info" />;
    if (rating <= 8) return <SentimentSatisfiedAltIcon fontSize="large" color="primary" />;
    return <SentimentVerySatisfiedIcon fontSize="large" color="success" />;
  };

  // Get color based on rating
  const getMoodColor = (rating: number) => {
    if (rating <= 2) return theme.palette.error.main;
    if (rating <= 4) return theme.palette.warning.main;
    if (rating <= 6) return theme.palette.info.main;
    if (rating <= 8) return theme.palette.primary.main;
    return theme.palette.success.main;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToGroups} sx={{ mr: 2 }}>
            Back to Groups
          </Button>
          <Typography variant="h5" component="h1">
            Error
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToGroups} sx={{ mr: 2 }}>
          Back to Groups
        </Button>
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          {group.groupName}
        </Typography>
        <Tooltip title="Leave Group">
          <IconButton color="error" onClick={handleLeaveGroup} sx={{ ml: 2 }}>
            <ExitToAppIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Group Details</Typography>
            </Box>
            <Chip
              label={getRoleLabel(group.userRole)}
              color={getRoleColor(group.userRole)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 2 }}>
            {group.groupDescription || 'No description provided.'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PeopleIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
            <Typography variant="body2">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Typography>
            <AvatarGroup max={4} sx={{ ml: 2 }}>
              <Avatar alt="John" src="/static/images/avatar/1.jpg" />
              <Avatar alt="Jane" src="/static/images/avatar/2.jpg" />
              <Avatar alt="Bob" src="/static/images/avatar/3.jpg" />
              <Avatar alt="Alice" src="/static/images/avatar/4.jpg" />
              <Avatar alt="Charlie" src="/static/images/avatar/5.jpg" />
            </AvatarGroup>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor:
                  copiedCode === group.joinCode ? 'action.selected' : 'background.paper',
                borderRadius: 2,
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
                {group.joinCode}
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => handleCopyJoinCode(group.joinCode)}
                variant="outlined"
                color="primary"
              >
                Copy
              </Button>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Mood Input Section */}
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            How are you feeling today?
            <Box sx={{ position: 'relative', ml: 2 }}>
              <Fade in={showMoodEmoji} timeout={500}>
                <Box sx={{ position: 'absolute', top: -10, left: 0 }}>
                  {getMoodEmoji(moodRating)}
                </Box>
              </Fade>
            </Box>
          </Typography>
          <Box sx={{ px: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Not great
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amazing
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 80 }}>
              <Slider
                value={moodRating}
                onChange={handleMoodRatingChange}
                aria-labelledby="mood-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={10}
                sx={{
                  color: getMoodColor(moodRating),
                  '& .MuiSlider-thumb': {
                    width: 28,
                    height: 28,
                    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                    '&:before': {
                      boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                    },
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(143, 197, 163, 0.16)',
                    },
                    '&.Mui-active': {
                      width: 34,
                      height: 34,
                    },
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.28,
                  },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: `${(moodRating - 1) * (100 / 9)}%`,
                  transform: 'translateX(-50%)',
                  transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                  pointerEvents: 'none',
                }}
              >
                <Zoom in={showMoodEmoji} timeout={500}>
                  <Box
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: '50%',
                      p: 0.5,
                      boxShadow: 2,
                    }}
                  >
                    {getMoodEmoji(moodRating)}
                  </Box>
                </Zoom>
              </Box>
            </Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                mt: 2,
                color: getMoodColor(moodRating),
                fontWeight: 'bold',
              }}
            >
              {moodRating}
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Add a note (optional)"
            variant="outlined"
            value={moodNote}
            onChange={handleMoodNoteChange}
            sx={{ mb: 2 }}
            placeholder="How was your day? What made you feel this way?"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitMood}
            fullWidth
            disabled={isSubmitting}
            sx={{
              py: 1.5,
              borderRadius: 2,
              boxShadow: 3,
              '&:hover': {
                boxShadow: 5,
              },
            }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Mood'}
          </Button>
        </CardContent>
      </Card>

      {/* Calendar and Ratings Section */}
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            Group Mood Calendar
            <Chip
              label={`${getRatingsForDate(selectedDate.format('YYYY-MM-DD')).length} ratings today`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                    p: 2,
                  }}
                >
                  <DateCalendar
                    value={selectedDate}
                    onChange={handleDateChange}
                    sx={{
                      width: '100%',
                      height: '100%',
                      flex: 1,
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Ratings for {selectedDate.format('MMMM D, YYYY')}
              </Typography>
              <Box sx={{ flex: 1, minHeight: 300, width: '100%' }}>
                {getRatingsForDate(selectedDate.format('YYYY-MM-DD')).length > 0 ? (
                  <BarChart
                    height={300}
                    series={getChartData().series}
                    xAxis={getChartData().xAxis}
                    margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                    colors={[theme.palette.primary.main]}
                    borderRadius={4}
                  />
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      p: 2,
                      border: `1px dashed ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No ratings for this date
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.type || 'info'}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
