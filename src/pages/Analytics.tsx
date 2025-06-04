import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
import { personalAnalyticsService } from '@/services/personalAnalyticsService';
import { groupService } from '@/services/groupService';
import { MoodInsights, TimeRange } from '@/types/Analytics';
import {
  Box,
  Container,
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
import ErrorBoundary from '@/components/ui/ClassErrorBoundary';
import AuthContext from '@/contexts/auth/authContext';
import { useLoadingState } from '@/hooks/useLoadingState';
import { Timestamp } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

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
              <MoodTrendChart
                insights={insights}
                height={chartHeight}
                isMobile={isMobile}
                timeRange={timeRange}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <DayOfWeekChart insights={insights} height={chartHeight} isMobile={isMobile} />
            </Box>
          </Box>

          <Box>
            <TimeOfDayChart insights={insights} height={chartHeight} isMobile={isMobile} />
          </Box>
        </Box>
      </Fade>
    );
  };

  /*eslint-disable */
  //@ts-ignore
  const generateTestData = async () => {
    try {
      if (!auth?.myUser) {
        setError('You must be logged in to generate test data');
        return;
      }

      // Create a test group
      const groupName = `Test Group ${new Date().toISOString().split('T')[0]}`;
      const group = await groupService.createGroup(
        groupName,
        'A test group for analytics visualization',
        auth.myUser
      );

      // Generate ratings for the last year with interesting patterns
      const today = new Date();
      const ratings = [];

      // Generate 365 days of data
      for (let i = 1; i <= 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Set a random time for the rating (full 24 hours)
        const randomHour = Math.floor(Math.random() * 24); // 0-23 hours
        const randomMinute = Math.floor(Math.random() * 60);
        date.setHours(randomHour, randomMinute, 0, 0);

        const dateStr = date.toISOString().split('T')[0];

        // Generate rating with some patterns
        let ratingNumber;

        // Create weekly pattern (better mood on weekends)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Weekend
          ratingNumber = Math.floor(Math.random() * 3) + 3; // 3-5
        } else {
          // Weekday
          ratingNumber = Math.floor(Math.random() * 3) + 1; // 1-3
        }

        // Add some monthly variation (better mood in summer)
        const month = date.getMonth();
        if (month >= 5 && month <= 8) {
          // Summer months
          ratingNumber = Math.min(5, ratingNumber + 1);
        }

        // Add some random variation
        if (Math.random() > 0.7) {
          ratingNumber = Math.max(1, Math.min(5, ratingNumber + (Math.random() > 0.5 ? 1 : -1)));
        }

        // Add some notes occasionally with more context
        let notes = '';
        if (Math.random() > 0.7) {
          const moods = ['Great day!', 'Feeling good', 'Not bad', 'Could be better', 'Rough day'];
          const activities = ['at work', 'with friends', 'at home', 'outside', 'traveling'];
          notes = `${moods[Math.floor(Math.random() * moods.length)]} ${
            activities[Math.floor(Math.random() * activities.length)]
          }`;
        }

        // Create rating with a specific date
        const ratingId = `${group.groupId}_${dateStr}_${auth.myUser.userId}`;
        const rating = {
          ratingId,
          groupId: group.groupId,
          userId: auth.myUser.userId,
          ratingDate: dateStr,
          ratingNumber,
          notes,
          createdAt: Timestamp.fromDate(date),
          updatedAt: Timestamp.fromDate(date),
        };

        // Use setDoc directly to bypass the service validation
        await setDoc(doc(db, 'ratings', ratingId), rating);
        ratings.push(rating);
      }

      // Force analytics refresh
      setTimeRange('week');
      setDataReady(false);
      setupSubscription();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate test data');
    }
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* <Button
                variant="contained"
                color="secondary"
                onClick={generateTestData}
                disabled={displayLoading}
              >
                Generate Test Data
              </Button>
              */}
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
