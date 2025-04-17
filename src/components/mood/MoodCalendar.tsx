import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  useTheme,
  Tooltip,
  Paper,
  Skeleton,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useEffect, useState } from 'react';

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
  onDateSelected?: (date: string) => void;
}

export const MoodCalendar = ({
  selectedDate,
  onDateChange,
  ratings,
  isLoading = false,
  onDateSelected,
}: MoodCalendarProps) => {
  const theme = useTheme();
  const [selectedDateRatings, setSelectedDateRatings] = useState<Rating[]>([]);

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

  // Update selected date ratings when selectedDate changes
  useEffect(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dateRatings = getRatingsForDate(dateStr);
    setSelectedDateRatings(dateRatings);

    // Notify parent component about date selection
    if (onDateSelected) {
      onDateSelected(dateStr);
    }
  }, [selectedDate, ratingsByDate, onDateSelected]);

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
    return {
      xAxis: [
        {
          data: selectedDateRatings.map(r => r.username),
          scaleType: 'band' as const,
        },
      ],
      series: [
        {
          data: selectedDateRatings.map(r => r.rating),
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
        PopperProps={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -8],
              },
            },
          ],
        }}
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
  const chartData = useMemo(() => getChartData(), [selectedDateRatings]);

  // Render loading skeleton for the calendar
  const renderCalendarSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width={100} height={30} />
        <Skeleton variant="text" width={100} height={30} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={40} height={30} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={36}
            height={36}
            sx={{ borderRadius: '50%' }}
          />
        ))}
      </Box>
    </Box>
  );

  // Render loading skeleton for the chart
  const renderChartSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
    </Box>
  );

  return (
    <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          Group Mood Calendar
          <Chip
            label={`${selectedDateRatings.length} ratings for ${selectedDate.format('MMM D')}`}
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
            {isLoading ? (
              renderCalendarSkeleton()
            ) : (
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
            )}
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
            {isLoading ? (
              renderChartSkeleton()
            ) : (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Ratings for {selectedDate.format('MMMM D, YYYY')}
                </Typography>
                <Box sx={{ flex: 1, minHeight: 300, width: '100%' }}>
                  {selectedDateRatings.length > 0 ? (
                    <BarChart
                      height={300}
                      series={chartData.series}
                      xAxis={chartData.xAxis}
                      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                      colors={[
                        theme.palette.error.main,
                        theme.palette.warning.main,
                        theme.palette.success.main,
                        theme.palette.info.main,
                        theme.palette.secondary.main,
                      ]}
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
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
