import { Paper, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { MoodInsights } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';

interface MoodInsightsCardProps {
  insights: MoodInsights;
}

export default function MoodInsightsCard({ insights }: MoodInsightsCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Helper function to get color based on rating
  const getRatingColor = (rating: number) => {
    const normalizedRating = (rating - RATING_MIN) / (RATING_MAX - RATING_MIN);

    if (normalizedRating < 0.3) {
      return theme.palette.error.main;
    } else if (normalizedRating < 0.7) {
      return theme.palette.warning.main;
    } else {
      return theme.palette.success.main;
    }
  };

  // Helper function to get emoji based on rating
  const getRatingEmoji = (rating: number) => {
    if (rating <= 3) return '😢';
    if (rating <= 5) return '😐';
    if (rating <= 7) return '🙂';
    if (rating <= 9) return '😊';
    return '😄';
  };

  const insightCardStyle = {
    p: { xs: 2, sm: 3 },
    height: '100%',
    minHeight: { xs: '140px', sm: '160px' },
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.06)',
      borderColor: 'rgba(0, 0, 0, 0.12)',
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: 'transparent',
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        Mood Insights
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 3 },
        }}
      >
        {/* Overall Average */}
        <Paper elevation={0} sx={insightCardStyle}>
          <EmojiEmotionsIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: getRatingColor(insights.overallAverage),
              mb: 1,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: getRatingColor(insights.overallAverage),
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {insights.overallAverage.toFixed(1)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Overall Average
          </Typography>
        </Paper>

        {/* Highest Mood */}
        <Paper elevation={0} sx={insightCardStyle}>
          <TrendingUpIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.success.main,
              mb: 1,
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.success.main,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {insights.highestMood}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              {getRatingEmoji(insights.highestMood)}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Highest Mood
          </Typography>
        </Paper>

        {/* Lowest Mood */}
        <Paper elevation={0} sx={insightCardStyle}>
          <TrendingDownIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.error.main,
              mb: 1,
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.error.main,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {insights.lowestMood}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              {getRatingEmoji(insights.lowestMood)}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Lowest Mood
          </Typography>
        </Paper>

        {/* Streak Days */}
        <Paper elevation={0} sx={insightCardStyle}>
          <LocalFireDepartmentIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.warning.main,
              mb: 1,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.warning.main,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {insights.streakDays}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Day Streak
          </Typography>
        </Paper>

        {/* Total Entries */}
        <Paper elevation={0} sx={insightCardStyle}>
          <AssessmentIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.info.main,
              mb: 1,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.info.main,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {insights.totalEntries}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Total Entries
          </Typography>
        </Paper>

        {/* Mood Volatility */}
        <Paper elevation={0} sx={insightCardStyle}>
          <TimelineIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.secondary.main,
              mb: 1,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.secondary.main,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {insights.moodVolatility.toFixed(1)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Mood Volatility
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
}
