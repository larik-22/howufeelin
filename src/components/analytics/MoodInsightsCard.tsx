import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, useTheme, Theme, Skeleton, Fade } from '@mui/material';
import { MoodInsights } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useLoadingState } from '@/hooks/useLoadingState';

export interface MoodInsightsCardProps {
  insights: MoodInsights;
  isLoading?: boolean;
}

const MoodInsightsCard: React.FC<MoodInsightsCardProps> = ({ insights, isLoading = false }) => {
  const theme = useTheme<Theme>();
  const [dataReady, setDataReady] = useState(false);
  const displayLoading = useLoadingState(isLoading, [insights], { minLoadingTime: 800 });

  // Track when data is ready to prevent flashing
  useEffect(() => {
    if (!isLoading && insights) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setDataReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDataReady(false);
    }
  }, [isLoading, insights]);

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

  const renderInsightCard = (
    icon: React.ReactNode,
    value: number | string,
    label: string,
    color: string,
    showEmoji = false
  ) => (
    <Paper elevation={0} sx={insightCardStyle}>
      <Fade in={!displayLoading} timeout={500}>
        <Box
          sx={{
            display: displayLoading ? 'none' : 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {icon}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h4"
              sx={{
                color,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                transition: 'all 0.3s ease',
                opacity: dataReady ? 1 : 0,
                transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              {value}
            </Typography>
            {showEmoji && (
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  transition: 'all 0.3s ease',
                  opacity: dataReady ? 1 : 0,
                  transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
                }}
              >
                {getRatingEmoji(Number(value))}
              </Typography>
            )}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              transition: 'all 0.3s ease',
              opacity: dataReady ? 1 : 0,
              transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
            }}
          >
            {label}
          </Typography>
        </Box>
      </Fade>
      {displayLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Skeleton variant="circular" width={32} height={32} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={60} height={40} />
          <Skeleton variant="text" width={80} sx={{ mt: 0.5 }} />
        </Box>
      )}
    </Paper>
  );

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
        {renderInsightCard(
          <EmojiEmotionsIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: getRatingColor(insights.overallAverage),
              mb: 1,
              transition: 'all 0.3s ease',
              opacity: dataReady ? 1 : 0,
              transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
            }}
          />,
          insights.overallAverage.toFixed(1),
          'Overall Average',
          getRatingColor(insights.overallAverage)
        )}

        {renderInsightCard(
          <TrendingUpIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.success.main,
              mb: 1,
              transition: 'all 0.3s ease',
              opacity: dataReady ? 1 : 0,
              transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
            }}
          />,
          insights.highestMood,
          'Highest Mood',
          theme.palette.success.main,
          true
        )}

        {renderInsightCard(
          <TrendingDownIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.error.main,
              mb: 1,
              transition: 'all 0.3s ease',
              opacity: dataReady ? 1 : 0,
              transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
            }}
          />,
          insights.lowestMood,
          'Lowest Mood',
          theme.palette.error.main,
          true
        )}

        {renderInsightCard(
          <LocalFireDepartmentIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.warning.main,
              mb: 1,
              transition: 'all 0.3s ease',
              opacity: dataReady ? 1 : 0,
              transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
            }}
          />,
          insights.streakDays,
          'Day Streak',
          theme.palette.warning.main
        )}

        {renderInsightCard(
          <AssessmentIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.info.main,
              mb: 1,
              transition: 'all 0.3s ease',
              opacity: dataReady ? 1 : 0,
              transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
            }}
          />,
          insights.totalEntries,
          'Total Entries',
          theme.palette.info.main
        )}

        {renderInsightCard(
          <TimelineIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: theme.palette.secondary.main,
              mb: 1,
              transition: 'all 0.3s ease',
              opacity: dataReady ? 1 : 0,
              transform: dataReady ? 'translateY(0)' : 'translateY(10px)',
            }}
          />,
          insights.moodVolatility.toFixed(1),
          'Mood Volatility',
          theme.palette.secondary.main
        )}
      </Box>
    </Paper>
  );
};

export default MoodInsightsCard;
