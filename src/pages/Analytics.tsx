import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
import { personalAnalyticsService } from '@/services/personalAnalyticsService';
import { MoodInsights, TimeRange } from '@/types/Analytics';
import {
  Box,
  Container,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Fade,
} from '@mui/material';
import MoodInsightsCard from '@/components/analytics/MoodInsightsCard';
import MoodTrendChart from '@/components/analytics/MoodTrendChart';
import DayOfWeekChart from '@/components/analytics/DayOfWeekChart';
import TimeOfDayChart from '@/components/analytics/TimeOfDayChart';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AuthContext from '@/contexts/auth/authContext';
import { useLoadingState } from '@/hooks/useLoadingState';

const Analytics: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const auth = useContext(AuthContext);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<MoodInsights | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [dataReady, setDataReady] = useState(false);

  // Use our custom loading hook with a minimum loading time
  const displayLoading = useLoadingState(isLoading, [timeRange], { minLoadingTime: 1000 });

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as TimeRange);
    setDataReady(false);
  };

  const setupSubscription = useCallback(async () => {
    try {
      if (!auth?.myUser) {
        setError('You must be logged in to view analytics');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setDataReady(false);

      const dateRange = personalAnalyticsService.getDateRangeForTimeRange(timeRange);
      const unsubscribeFn = personalAnalyticsService.subscribeToMoodInsights(
        auth.myUser.userId, // Use the actual user ID from auth
        dateRange,
        (newInsights: MoodInsights) => {
          setInsights(newInsights);
          setIsLoading(false);

          // Small delay to ensure smooth transition
          setTimeout(() => {
            setDataReady(true);
          }, 100);
        }
      );

      setUnsubscribe(() => unsubscribeFn);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  }, [timeRange, auth]);

  useEffect(() => {
    setupSubscription();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setupSubscription]);

  const chartHeight = useMemo(() => (isMobile ? 300 : 400), [isMobile]);

  const renderCharts = () => {
    if (!insights) return null;

    return (
      <Fade in={dataReady} timeout={800}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box>
            <MoodInsightsCard insights={insights} isLoading={displayLoading} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>
            <Box sx={{ flex: 2 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Mood Trends
                </Typography>
                <MoodTrendChart insights={insights} height={chartHeight} />
              </Paper>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Day of Week Patterns
                </Typography>
                <DayOfWeekChart insights={insights} height={chartHeight} />
              </Paper>
            </Box>
          </Box>

          <Box>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Time of Day Patterns
              </Typography>
              <TimeOfDayChart insights={insights} height={chartHeight} isMobile={isMobile} />
            </Paper>
          </Box>
        </Box>
      </Fade>
    );
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 2 : 0,
              mb: 4,
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom={isMobile}>
              Mood Analytics
            </Typography>
            <FormControl sx={{ minWidth: isMobile ? '100%' : 120 }}>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {displayLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                gap: 2,
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body1" color="text.secondary">
                Loading your mood analytics...
              </Typography>
              <Box sx={{ width: '100%', mt: 4 }}>
                <MoodInsightsCard
                  insights={{
                    overallAverage: 0,
                    highestMood: 0,
                    lowestMood: 0,
                    moodVolatility: 0,
                    streakDays: 0,
                    totalEntries: 0,
                    moodTrends: [],
                    dayOfWeekPatterns: [],
                    timeOfDayPatterns: [],
                    recentRatings: [],
                  }}
                  isLoading={true}
                />
              </Box>
            </Box>
          ) : (
            renderCharts()
          )}
        </Box>
      </Container>
    </ErrorBoundary>
  );
};

export default Analytics;
