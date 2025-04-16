import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  useTheme,
  Tooltip,
  CircularProgress,
  Paper,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo } from 'react';

interface Rating {
  userId: string;
  username: string;
  rating: number;
  date: string;
}

interface MoodCalendarProps {
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs | null) => void;
  ratings: Rating[];
  isLoading?: boolean;
}

export const MoodCalendar = ({
  selectedDate,
  onDateChange,
  ratings,
  isLoading = false,
}: MoodCalendarProps) => {
  const theme = useTheme();

  // Memoize the ratings by date to avoid recalculating on every render
  const ratingsByDate = useMemo(() => {
    const map = new Map<string, Rating[]>();

    ratings.forEach(rating => {
      if (!map.has(rating.date)) {
        map.set(rating.date, []);
      }
      map.get(rating.date)?.push(rating);
    });

    return map;
  }, [ratings]);

  // Get ratings for a specific date
  const getRatingsForDate = (date: string) => {
    return ratingsByDate.get(date) || [];
  };

  // Check if a date has any ratings
  const hasRatingsForDate = (date: string) => {
    return ratingsByDate.has(date);
  };

  // Get average rating for a date
  const getAverageRatingForDate = (date: string) => {
    const dateRatings = getRatingsForDate(date);
    if (dateRatings.length === 0) return 0;

    const sum = dateRatings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / dateRatings.length) * 10) / 10;
  };

  // Get color based on rating value
  const getRatingColor = (rating: number) => {
    if (rating <= 3) return theme.palette.error.main;
    if (rating <= 6) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Get chart data for the selected date
  const getChartData = () => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dateRatings = getRatingsForDate(dateStr);

    return {
      xAxis: [
        {
          data: dateRatings.map(r => r.username),
          scaleType: 'band' as const,
        },
      ],
      series: [
        {
          data: dateRatings.map(r => r.rating),
          color: theme.palette.primary.main,
        },
      ],
    };
  };

  // Custom day component for the calendar
  const CustomPickersDay = (props: PickersDayProps<Dayjs>) => {
    const { day, ...other } = props;
    const dateStr = day.format('YYYY-MM-DD');
    const hasRatings = hasRatingsForDate(dateStr);
    const avgRating = getAverageRatingForDate(dateStr);
    const ratingColor = getRatingColor(avgRating);

    return (
      <Tooltip
        title={hasRatings ? `Average rating: ${avgRating}` : 'No ratings'}
        arrow
        placement="top"
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <PickersDay
            {...other}
            day={day}
            sx={{
              ...other.sx,
              ...(hasRatings && {
                '&:not(.Mui-selected)': {
                  backgroundColor: `${ratingColor}20`,
                  '&:hover': {
                    backgroundColor: `${ratingColor}40`,
                  },
                },
                '&.Mui-selected': {
                  backgroundColor: ratingColor,
                  '&:hover': {
                    backgroundColor: ratingColor,
                  },
                },
              }),
            }}
          />
          {hasRatings && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: ratingColor,
              }}
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  // Memoize chart data to avoid recalculating on every render
  const chartData = useMemo(() => getChartData(), [selectedDate, ratingsByDate]);

  return (
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

        {/* Rating Legend */}
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ mr: 1 }}>
              Rating:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.error.main,
                    mr: 0.5,
                  }}
                />
                <Typography variant="caption">Low (1-3)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.warning.main,
                    mr: 0.5,
                  }}
                />
                <Typography variant="caption">Medium (4-6)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                    mr: 0.5,
                  }}
                />
                <Typography variant="caption">High (7-10)</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              position: 'relative',
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1,
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={40} />
              </Box>
            )}
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
                  onChange={onDateChange}
                  slots={{
                    day: CustomPickersDay,
                  }}
                  sx={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    '& .MuiPickersDay-root': {
                      width: 36,
                      height: 36,
                      margin: '0 2px',
                    },
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
              position: 'relative',
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1,
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={40} />
              </Box>
            )}
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Ratings for {selectedDate.format('MMMM D, YYYY')}
            </Typography>
            <Box sx={{ flex: 1, minHeight: 300, width: '100%' }}>
              {getRatingsForDate(selectedDate.format('YYYY-MM-DD')).length > 0 ? (
                <BarChart
                  height={300}
                  series={chartData.series}
                  xAxis={chartData.xAxis}
                  margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                  colors={[theme.palette.primary.main]}
                  borderRadius={4}
                  tooltip={{ trigger: 'item' }}
                  axisHighlight={{
                    x: 'band',
                    y: 'line',
                  }}
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
  );
};
