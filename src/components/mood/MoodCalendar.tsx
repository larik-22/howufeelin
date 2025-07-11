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
  Avatar,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { BarChart } from '@mui/x-charts/BarChart';
import { MusicNote } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useEffect, useState } from 'react';
import { SongOfTheDay } from '@/types/Rating';

interface CalendarRating {
  userId: string;
  username: string;
  rating: number;
  date: string;
  notes?: string;
  songOfTheDay?: SongOfTheDay;
}

interface MoodCalendarProps {
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs | null) => void;
  ratings: CalendarRating[];
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
  const [selectedDateRatings, setSelectedDateRatings] = useState<CalendarRating[]>([]);

  // Memoize the ratings by date to avoid recalculating on every render
  const ratingsByDate = useMemo(() => {
    const map = new Map<string, CalendarRating[]>();

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
  const getBarColor = (rating: number) => {
    if (rating <= 3) return theme.palette.error.main;
    if (rating <= 6) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Render song of the day component
  const renderSongOfTheDay = (rating: CalendarRating) => {
    if (!rating.songOfTheDay) return null;

    const song = rating.songOfTheDay;

    const handleSongClick = () => {
      if (song.spotifyId) {
        // Open directly in Spotify web player
        window.open(`https://open.spotify.com/track/${song.spotifyId}`, '_blank');
      }
    };

    return (
      <Box
        onClick={handleSongClick}
        sx={{
          mt: 1,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderRadius: 1,
          bgcolor: 'background.default',
          border: `1px solid ${theme.palette.divider}`,
          cursor: 'pointer',
          transition: 'all 0.15s ease-out',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: '#1DB954',
          },
        }}
      >
        <Avatar
          src={song.albumImageUrl}
          variant="rounded"
          sx={{
            width: 24,
            height: 24,
            bgcolor: 'grey.200',
            borderRadius: 0.5,
          }}
        >
          <MusicNote sx={{ fontSize: '10px', color: 'text.secondary' }} />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              fontSize: '0.7rem',
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
              fontSize: '0.65rem',
              opacity: 0.8,
            }}
          >
            {song.artists[0]}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MusicNote sx={{ fontSize: '8px', color: 'theme.main' }} />
        </Box>
      </Box>
    );
  };

  // Get chart data for the selected date
  const getChartData = () => {
    // Use the actual ratings data for the selected date
    const data = selectedDateRatings;

    // Calculate the maximum label length to determine bottom margin
    const maxLabelLength = Math.max(...data.map(r => r.username.length));
    const bottomMargin = Math.max(80, 40 + maxLabelLength * 4); // Base margin + extra space for long labels

    // Create color map based on rating values
    const barColors = data.map(r => {
      if (r.rating <= 3) return theme.palette.error.main;
      if (r.rating <= 6) return theme.palette.warning.main;
      return theme.palette.success.main;
    });

    return {
      xAxis: [
        {
          data: data.map(r => r.username),
          scaleType: 'band' as const,
          tickLabelStyle: {
            angle: -45,
            textAnchor: 'end' as const,
            fontSize: 12,
          },
          colorMap: {
            type: 'ordinal' as const,
            values: data.map(r => r.username),
            colors: barColors,
          },
        },
      ],
      series: [
        {
          data: data.map(r => r.rating),
          label: 'Rating',
          valueFormatter: (value: number | null, context: { dataIndex: number }) => {
            if (value === null) return '';
            return `${data[context.dataIndex].username}: ${value}`;
          },
        },
      ],
      bottomMargin,
    };
  };

  // Custom day component for the calendar
  const CustomPickersDay = (props: PickersDayProps<Dayjs>) => {
    const { day, ...other } = props;
    const dateStr = day.format('YYYY-MM-DD');
    const hasRatings = hasRatingsForDate(dateStr);
    const avgRating = getAverageRatingForDate(dateStr);
    const ratingColor = getBarColor(avgRating);

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
            height: { md: 600 },
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              position: 'relative',
              height: '100%',
              bgcolor: 'background.paper',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
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
                    alignItems: 'flex-start',
                    height: '100%',
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
                      '& .MuiPickersCalendarHeader-root': {
                        marginTop: 0,
                        padding: '8px 0',
                      },
                      '& .MuiPickersDay-root': {
                        width: 36,
                        height: 36,
                        margin: '0 2px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: `${theme.palette.primary.main}15`,
                        },
                      },
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      },
                      '& .MuiPickersCalendarHeader-label': {
                        fontSize: '1rem',
                        fontWeight: 600,
                      },
                      '& .MuiPickersArrowSwitcher-button': {
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: `${theme.palette.primary.main}15`,
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
              borderRadius: 2,
              p: 2,
              position: 'relative',
              height: '100%',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            {isLoading ? (
              renderChartSkeleton()
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                >
                  {selectedDate.format('MMMM D, YYYY')}
                  <Chip
                    label={`${selectedDateRatings.length} ratings`}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Box sx={{ flex: '0 0 300px', width: '100%' }}>
                  {selectedDateRatings.length > 0 ? (
                    <BarChart
                      height={300}
                      series={chartData.series}
                      xAxis={chartData.xAxis}
                      margin={{ top: 10, bottom: chartData.bottomMargin, left: 40, right: 10 }}
                      borderRadius={8}
                      slotProps={{
                        legend: {
                          hidden: true,
                        },
                      }}
                      tooltip={{
                        trigger: 'item',
                      }}
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
                        No comments or songs for this date
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Comments Section */}
                {selectedDateRatings.length > 0 && (
                  <Box
                    sx={{ mt: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        Comments & Songs
                      </Typography>
                      <Chip
                        label={`${
                          selectedDateRatings.filter(r => r.notes || r.songOfTheDay).length
                        } items`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        flex: 1,
                        overflowY: 'auto',
                        p: 1,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: theme.palette.divider,
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: theme.palette.action.hover,
                        },
                      }}
                    >
                      {selectedDateRatings
                        .filter(rating => rating.notes || rating.songOfTheDay)
                        .map(rating => (
                          <Paper
                            key={rating.userId}
                            elevation={0}
                            sx={{
                              p: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 2,
                              bgcolor: 'background.paper',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 1,
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  color: theme.palette.text.primary,
                                }}
                              >
                                {rating.username}
                              </Typography>
                              <Chip
                                label={`Rating: ${rating.rating}`}
                                size="small"
                                sx={{
                                  bgcolor: getBarColor(rating.rating),
                                  color: 'white',
                                  fontWeight: 500,
                                  '& .MuiChip-label': {
                                    px: 1,
                                  },
                                }}
                              />
                            </Box>

                            {rating.notes && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                  mb: rating.songOfTheDay ? 1 : 0,
                                }}
                              >
                                {rating.notes}
                              </Typography>
                            )}

                            {/* Song of the Day */}
                            {renderSongOfTheDay(rating)}
                          </Paper>
                        ))}
                      {selectedDateRatings.filter(rating => rating.notes || rating.songOfTheDay)
                        .length === 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            border: `1px dashed ${theme.palette.divider}`,
                            borderRadius: 2,
                            bgcolor: `${theme.palette.background.default}50`,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            No comments or songs for this date
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
