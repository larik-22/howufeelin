import { Box, Card, CardContent, Typography, Chip, useTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';

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
}

export const MoodCalendar = ({ selectedDate, onDateChange, ratings }: MoodCalendarProps) => {
  const theme = useTheme();

  const getRatingsForDate = (date: string) => {
    return ratings.filter(rating => rating.date === date);
  };

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
            }}
          >
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
                  sx={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
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
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Ratings for {selectedDate.format('MMMM D, YYYY')}
            </Typography>
            <Box sx={{ flex: 1, minHeight: 300, width: '100%' }}>
              {getRatingsForDate(selectedDate.format('YYYY-MM-DD')).length > 0 ? (
                <BarChart
                  height={300}
                  series={getChartData().series}
                  xAxis={getChartData().xAxis}
                  margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                  colors={[theme.palette.primary.main]}
                  borderRadius={4}
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
