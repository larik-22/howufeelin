import { Box, Container, Typography, useTheme, useMediaQuery } from '@mui/material';
import MoodInsightsCard from '@/components/analytics/MoodInsightsCard';
import MoodTrendChart from '@/components/analytics/MoodTrendChart';
import DayOfWeekChart from '@/components/analytics/DayOfWeekChart';
import TimeOfDayChart from '@/components/analytics/TimeOfDayChart';
import { MoodInsights } from '@/types/Analytics';
import { Timestamp } from 'firebase/firestore';

// Placeholder data for testing
const placeholderInsights: MoodInsights = {
  overallAverage: 7.5,
  highestMood: 9,
  lowestMood: 4,
  streakDays: 5,
  totalEntries: 42,
  moodVolatility: 1.8,
  moodTrends: [
    { date: '2023-05-01', averageRating: 7.2, count: 5 },
    { date: '2023-05-02', averageRating: 8.1, count: 6 },
    { date: '2023-05-03', averageRating: 6.8, count: 4 },
    { date: '2023-05-04', averageRating: 7.5, count: 7 },
    { date: '2023-05-05', averageRating: 8.3, count: 5 },
  ],
  dayOfWeekPatterns: [
    { dayOfWeek: 0, averageRating: 7.8, count: 10 },
    { dayOfWeek: 1, averageRating: 7.2, count: 8 },
    { dayOfWeek: 2, averageRating: 7.5, count: 9 },
    { dayOfWeek: 3, averageRating: 7.1, count: 7 },
    { dayOfWeek: 4, averageRating: 7.9, count: 8 },
    { dayOfWeek: 5, averageRating: 8.2, count: 6 },
    { dayOfWeek: 6, averageRating: 8.5, count: 5 },
  ],
  timeOfDayPatterns: [
    { hour: 8, averageRating: 7.2, count: 5 },
    { hour: 12, averageRating: 7.8, count: 8 },
    { hour: 18, averageRating: 7.5, count: 6 },
    { hour: 20, averageRating: 8.1, count: 4 },
  ],
  recentRatings: [
    {
      ratingId: '1',
      groupId: 'group1',
      userId: 'user1',
      ratingNumber: 8,
      ratingDate: '2023-05-05',
      notes: 'Feeling great today!',
      createdAt: Timestamp.fromDate(new Date('2023-05-05T10:00:00')),
      updatedAt: Timestamp.fromDate(new Date('2023-05-05T10:00:00')),
    },
    {
      ratingId: '2',
      groupId: 'group1',
      userId: 'user2',
      ratingNumber: 7,
      ratingDate: '2023-05-05',
      notes: 'Good day overall',
      createdAt: Timestamp.fromDate(new Date('2023-05-05T11:30:00')),
      updatedAt: Timestamp.fromDate(new Date('2023-05-05T11:30:00')),
    },
  ],
};

export default function Analytics() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 3, sm: 4, md: 6 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 3, sm: 4, md: 6 },
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'text.primary',
        }}
      >
        Analytics
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, sm: 4, md: 6 },
        }}
      >
        {/* Insights Section */}
        <Box>
          <MoodInsightsCard insights={placeholderInsights} />
        </Box>

        {/* Charts Section */}
        <Box>
          {/* Mood Trends Chart */}
          <Box
            sx={{
              mb: { xs: 3, sm: 4 },
              '& .MuiPaper-root': {
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              },
            }}
          >
            <MoodTrendChart
              trends={placeholderInsights.moodTrends}
              title="Mood Trends"
              height={isMobile ? 300 : 400}
            />
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
              '& .MuiPaper-root': {
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              },
            }}
          >
            <DayOfWeekChart
              patterns={placeholderInsights.dayOfWeekPatterns}
              title="Day of Week Patterns"
              height={isMobile ? 300 : 350}
            />
            <TimeOfDayChart
              patterns={placeholderInsights.timeOfDayPatterns}
              title="Time of Day Patterns"
              height={isMobile ? 300 : 350}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
