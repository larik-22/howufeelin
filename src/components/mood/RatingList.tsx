import { Box, Card, CardContent, Typography, Avatar, Chip, Divider } from '@mui/material';
import { Rating } from '@/types/Rating';
import { GroupMember } from '@/types/GroupMember';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import { useTheme } from '@mui/material/styles';

interface RatingListProps {
  ratings: Rating[];
  groupMembers: GroupMember[];
  title?: string;
}

export const RatingList = ({ ratings, groupMembers, title = "Today's Moods" }: RatingListProps) => {
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
              {index < ratings.length - 1 && <Divider sx={{ my: 1.5 }} />}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
