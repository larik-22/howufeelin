import {
  Box,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  Paper,
} from '@mui/material';
import { useState, useEffect, useContext } from 'react';
import MoodInsightsCard from '@/components/analytics/MoodInsightsCard';
import MoodTrendChart from '@/components/analytics/MoodTrendChart';
import DayOfWeekChart from '@/components/analytics/DayOfWeekChart';
import TimeOfDayChart from '@/components/analytics/TimeOfDayChart';
import { MoodInsights, TimeRange } from '@/types/Analytics';
import { personalAnalyticsService } from '@/services/personalAnalyticsService';
import AuthContext from '@/contexts/auth/authContext';

export default function Analytics() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const auth = useContext(AuthContext);

  const [insights, setInsights] = useState<MoodInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      if (!auth?.myUser) return;

      try {
        setLoading(true);
        const dateRange = personalAnalyticsService.getDateRangeForTimeRange(timeRange);

        // Set up subscription to mood insights
        unsubscribe = personalAnalyticsService.subscribeToMoodInsights(
          auth.myUser.userId,
          dateRange,
          newInsights => {
            setInsights(newInsights);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up mood insights subscription:', error);
        setLoading(false);
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [auth?.myUser, timeRange]);

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: TimeRange | null
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  const renderSkeletonCard = () => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={60} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 2,
          }}
        >
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={100} />
        </Box>
      </Box>
    </Paper>
  );

  const renderSkeletonChart = (height: number = 350) => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" height={height} />
      </Box>
    </Paper>
  );

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 3, sm: 4, md: 6 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: { xs: 3, sm: 4, md: 6 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'text.primary',
            mb: { xs: 2, sm: 0 },
          }}
        >
          Analytics
        </Typography>

        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          aria-label="time range"
          size="small"
        >
          <ToggleButton value="week" aria-label="week">
            Week
          </ToggleButton>
          <ToggleButton value="month" aria-label="month">
            Month
          </ToggleButton>
          <ToggleButton value="year" aria-label="year">
            Year
          </ToggleButton>
          <ToggleButton value="all" aria-label="all time">
            All Time
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, sm: 4, md: 6 },
        }}
      >
        {/* Insights Section */}
        <Box>
          {loading ? renderSkeletonCard() : insights && <MoodInsightsCard insights={insights} />}
        </Box>

        {/* Charts Section */}
        <Box>
          {/* Mood Trends Chart */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            {loading
              ? renderSkeletonChart(isMobile ? 300 : 400)
              : insights && (
                  <MoodTrendChart
                    trends={insights.moodTrends}
                    title="Mood Trends"
                    height={isMobile ? 300 : 400}
                  />
                )}
          </Box>

          {/* Day and Time Patterns */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
              },
              gap: { xs: 3, sm: 4 },
            }}
          >
            {loading ? (
              <>
                {renderSkeletonChart(isMobile ? 300 : 350)}
                {renderSkeletonChart(isMobile ? 300 : 350)}
              </>
            ) : (
              insights && (
                <>
                  <DayOfWeekChart
                    patterns={insights.dayOfWeekPatterns}
                    title="Day of Week Patterns"
                    height={isMobile ? 300 : 350}
                  />
                  <TimeOfDayChart
                    patterns={insights.timeOfDayPatterns}
                    title="Time of Day Patterns"
                    height={isMobile ? 300 : 350}
                  />
                </>
              )
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
