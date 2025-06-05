import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Rating } from '@/types/Rating';
import { GroupMember } from '@/types/GroupMember';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import { MusicNote } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { SongPlayButton } from '@/components/spotify/SongPlayButton';
import LaunchIcon from '@mui/icons-material/Launch';

interface RatingListProps {
  ratings: Rating[];
  groupMembers: GroupMember[];
  title?: string;
  isLoading?: boolean;
}

export const RatingList = ({
  ratings,
  groupMembers,
  title = "Today's Moods",
  isLoading = false,
}: RatingListProps) => {
  const theme = useTheme();

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return <SentimentVeryDissatisfiedIcon fontSize="small" />;
    if (rating <= 4) return <SentimentDissatisfiedIcon fontSize="small" />;
    if (rating <= 6) return <SentimentSatisfiedIcon fontSize="small" />;
    if (rating <= 8) return <SentimentSatisfiedAltIcon fontSize="small" />;
    return <SentimentVerySatisfiedIcon fontSize="small" />;
  };

  const getMoodColor = (rating: number) => {
    if (rating <= 2) return theme.palette.error.light;
    if (rating <= 4) return theme.palette.warning.light;
    if (rating <= 6) return theme.palette.info.light;
    if (rating <= 8) return theme.palette.primary.light;
    return theme.palette.success.light;
  };

  const getMoodTextColor = (rating: number) => {
    if (rating <= 2) return theme.palette.error.dark;
    if (rating <= 4) return theme.palette.warning.dark;
    if (rating <= 6) return theme.palette.info.dark;
    if (rating <= 8) return theme.palette.primary.dark;
    return theme.palette.success.dark;
  };

  const getMemberName = (userId: string) => {
    const member = groupMembers.find(m => m.userId === userId);
    return member?.displayName || 'Unknown User';
  };

  const getMemberAvatar = (userId: string) => {
    const member = groupMembers.find(m => m.userId === userId);
    if (member?.photoURL) {
      return member.photoURL;
    }
    // Get the user's initial for the fallback avatar
    const userInitial = getMemberName(userId)[0]?.toUpperCase() || 'U';
    return userInitial;
  };

  // Render song of the day component
  const renderSongOfTheDay = (rating: Rating) => {
    if (!rating.songOfTheDay) return null;

    const song = rating.songOfTheDay;

    return (
      <Box
        sx={{
          ml: 7,
          mt: 1,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: 1,
          bgcolor: 'background.default',
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.15s ease-out',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'primary.main',
          },
        }}
      >
        <Avatar
          src={song.albumImageUrl}
          variant="rounded"
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'grey.200',
            borderRadius: 1,
          }}
        >
          <MusicNote sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              mb: 0.5,
            }}
          >
            {song.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
              opacity: 0.8,
            }}
          >
            {song.artists[0]} • {song.album}
          </Typography>
        </Box>

        {/* Play button */}
        {song.spotifyId && (
          <SongPlayButton
            trackUri={`spotify:track:${song.spotifyId}`}
            trackName={song.name}
            size="small"
          />
        )}

        {/* Fallback link for non-premium users or if player fails */}
        {song.spotifyId && (
          <Tooltip title={`Open ${song.name} in Spotify`}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                window.open(`https://open.spotify.com/track/${song.spotifyId}`, '_blank');
              }}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Card sx={{ mt: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
          {[1, 2, 3].map(index => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width={120} sx={{ mb: 0.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Skeleton variant="rounded" width={80} height={24} sx={{ mr: 1 }} />
                    <Skeleton variant="text" width={60} />
                  </Box>
                </Box>
              </Box>
              <Skeleton variant="text" width="60%" sx={{ ml: 7, mb: 1 }} />
              {/* Song skeleton */}
              <Box sx={{ ml: 7, mt: 1.5, mb: 1 }}>
                <Skeleton variant="rectangular" width="100%" height={72} sx={{ borderRadius: 2 }} />
              </Box>
              {index < 2 && <Divider sx={{ my: 1.5 }} />}
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card sx={{ mt: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No ratings yet for today.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 3, boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Box>
          {ratings.map((rating, index) => (
            <Box key={rating.ratingId}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={
                    typeof getMemberAvatar(rating.userId) === 'string' &&
                    getMemberAvatar(rating.userId).startsWith('http')
                      ? getMemberAvatar(rating.userId)
                      : undefined
                  }
                  sx={{
                    mr: 2,
                    bgcolor: 'primary.main',
                  }}
                >
                  {typeof getMemberAvatar(rating.userId) === 'string' &&
                  !getMemberAvatar(rating.userId).startsWith('http')
                    ? getMemberAvatar(rating.userId)
                    : undefined}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1">{getMemberName(rating.userId)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      icon={getMoodEmoji(rating.ratingNumber)}
                      label={`${rating.ratingNumber}/10`}
                      size="small"
                      sx={{
                        bgcolor: getMoodColor(rating.ratingNumber),
                        color: getMoodTextColor(rating.ratingNumber),
                        mr: 1,
                        '& .MuiChip-icon': {
                          color: getMoodTextColor(rating.ratingNumber),
                        },
                        '&:hover': {
                          bgcolor: getMoodColor(rating.ratingNumber),
                          opacity: 0.9,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(rating.createdAt.toDate()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {rating.notes && (
                <Typography
                  variant="body2"
                  sx={{ ml: 7, mb: 1, fontStyle: 'italic', color: 'text.secondary' }}
                >
                  "{rating.notes}"
                </Typography>
              )}

              {/* Song of the Day */}
              {renderSongOfTheDay(rating)}

              {index < ratings.length - 1 && <Divider sx={{ my: 1.5 }} />}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
