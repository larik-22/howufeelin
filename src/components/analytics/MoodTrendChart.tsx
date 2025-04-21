import React from 'react';
import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Box,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { MoodInsights, TimeRange } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import dayjs from 'dayjs';

export interface MoodTrendChartProps {
  insights: MoodInsights;
  height: number;
  isMobile?: boolean;
  timeRange: TimeRange;
}

interface ChartDataPoint {
  date: string;
  rating: number;
  count: number;
  rawDate: dayjs.Dayjs;
}

const POINTS_PER_PAGE = 7; // Show one week of data per page

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({
  insights,
  height,
  isMobile: isMobileProp,
  timeRange,
}) => {
  const theme = useTheme();
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileBreakpoint;
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [currentTimeRange, setCurrentTimeRange] = useState<string>('');

  useEffect(() => {
    // Format data for the chart with better date formatting
    const formattedData = insights.moodTrends.map(trend => ({
      date: new Date(trend.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      rating: Number(trend.averageRating.toFixed(1)),
      count: trend.count,
      rawDate: dayjs(trend.date), // Store the raw date for filtering
    }));

    setData(formattedData);
  }, [insights.moodTrends]);

  const totalPages = Math.ceil(data.length / POINTS_PER_PAGE);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const navigateToDate = (date: dayjs.Dayjs, timeRangeLabel: string) => {
    // Find the index of the first data point that falls on or after the selected date
    const startIndex = data.findIndex(
      point => point.rawDate.isAfter(date.subtract(1, 'day')) || point.rawDate.isSame(date, 'day')
    );

    if (startIndex !== -1) {
      // Calculate which page this index belongs to
      const newPage = Math.floor(startIndex / POINTS_PER_PAGE);
      setCurrentPage(newPage);
      setCurrentTimeRange(timeRangeLabel);
    }

    handleMenuClose();
  };

  const navigateToWeek = (date: dayjs.Dayjs, timeRangeLabel: string) => {
    // Find the index of the first data point that falls within the selected week
    const weekStart = date.startOf('week');
    const weekEnd = date.endOf('week');

    const startIndex = data.findIndex(
      point =>
        point.rawDate.isAfter(weekStart.subtract(1, 'day')) &&
        point.rawDate.isBefore(weekEnd.add(1, 'day'))
    );

    if (startIndex !== -1) {
      // Calculate which page this index belongs to
      const newPage = Math.floor(startIndex / POINTS_PER_PAGE);
      setCurrentPage(newPage);
      setCurrentTimeRange(timeRangeLabel);
    }

    handleMenuClose();
  };

  const navigateToMonth = (date: dayjs.Dayjs, timeRangeLabel: string) => {
    // Find the index of the first data point that falls within the selected month
    const monthStart = date.startOf('month');
    const monthEnd = date.endOf('month');

    const startIndex = data.findIndex(
      point =>
        point.rawDate.isAfter(monthStart.subtract(1, 'day')) &&
        point.rawDate.isBefore(monthEnd.add(1, 'day'))
    );

    if (startIndex !== -1) {
      // Calculate which page this index belongs to
      const newPage = Math.floor(startIndex / POINTS_PER_PAGE);
      setCurrentPage(newPage);
      setCurrentTimeRange(timeRangeLabel);
    }

    handleMenuClose();
  };

  const navigateToLastWeek = () => {
    const lastWeek = dayjs().subtract(1, 'week');
    navigateToWeek(lastWeek, 'Last Week');
  };

  const navigateToLastMonth = () => {
    const lastMonth = dayjs().subtract(1, 'month');
    navigateToMonth(lastMonth, 'Last Month');
  };

  const navigateToLastThreeMonths = () => {
    const threeMonthsAgo = dayjs().subtract(3, 'month');
    navigateToDate(threeMonthsAgo, 'Last 3 Months');
  };

  const navigateToLastSixMonths = () => {
    const sixMonthsAgo = dayjs().subtract(6, 'month');
    navigateToDate(sixMonthsAgo, 'Last 6 Months');
  };

  const navigateToLastYear = () => {
    const lastYear = dayjs().subtract(1, 'year');
    navigateToDate(lastYear, 'Last Year');
  };

  const open = Boolean(menuAnchor);
  const id = open ? 'date-menu' : undefined;

  // Calculate chart height based on mobile state and time range
  const chartHeight = isMobile ? height * 0.65 : height * 0.85;

  // Get current page data
  const currentData = data.slice(
    currentPage * POINTS_PER_PAGE,
    (currentPage + 1) * POINTS_PER_PAGE
  );

  // Calculate the date range for the current page
  const currentPageStartDate = currentData[0]?.rawDate;
  const currentPageEndDate = currentData[currentData.length - 1]?.rawDate;

  // Format the date range for display
  const dateRangeText =
    currentPageStartDate && currentPageEndDate
      ? `${currentPageStartDate.format('MMM D')} - ${currentPageEndDate.format('MMM D, YYYY')}`
      : '';

  // Determine if we should show navigation controls based on time range
  const showNavigationControls = timeRange !== 'week';
  const showDateMenu = timeRange === 'year' || timeRange === 'all';

  if (insights.moodTrends.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No mood data available for the selected period
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
        height: isMobile ? height * 0.85 : height,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          mb: isMobile ? 1 : 1.5,
          gap: isMobile ? 0.5 : 0,
        }}
      >
        <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ mb: isMobile ? 0.5 : 0 }}>
          Mood Trends
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? 0.5 : 1,
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: isMobile ? 8 : 10,
                height: isMobile ? 8 : 10,
                borderRadius: '50%',
                backgroundColor: theme.palette.error.main,
                mr: 0.5,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem' }}>
              Low (1-3)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: isMobile ? 8 : 10,
                height: isMobile ? 8 : 10,
                borderRadius: '50%',
                backgroundColor: theme.palette.warning.main,
                mr: 0.5,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem' }}>
              Medium (4-6)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: isMobile ? 8 : 10,
                height: isMobile ? 8 : 10,
                borderRadius: '50%',
                backgroundColor: theme.palette.success.main,
                mr: 0.5,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem' }}>
              High (7-10)
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <LineChart
          series={[
            {
              data: currentData.map(d => d.rating),
              label: 'Mood Rating',
              color: theme.palette.primary.main,
              showMark: !isMobile,
              valueFormatter: value => `Rating: ${value}`,
              area: true,
              curve: 'monotoneX',
            },
          ]}
          xAxis={[
            {
              data: currentData.map((_, index) => index),
              tickLabelStyle: {
                fontSize: isMobile ? 8 : 10,
                angle: isMobile ? -45 : -45,
                textAnchor: 'end',
              },
              tickSize: 0,
              valueFormatter: value => currentData[value]?.date || '',
              tickInterval: isMobile
                ? (_, index) => index % Math.ceil(currentData.length / 3) === 0
                : undefined,
            },
          ]}
          yAxis={[
            {
              min: RATING_MIN,
              max: RATING_MAX,
              tickLabelStyle: { fontSize: isMobile ? 8 : 10 },
              tickSize: 0,
            },
          ]}
          height={chartHeight}
          margin={{
            top: 10,
            right: isMobile ? 10 : 20,
            left: isMobile ? 10 : 20,
            bottom: isMobile ? 50 : 70,
          }}
          sx={{
            '.MuiLineElement-root': {
              strokeWidth: isMobile ? 1.5 : 2,
            },
            '.MuiMarkElement-root': {
              stroke: theme.palette.primary.main,
              scale: isMobile ? '1.2' : '1.5',
            },
            '.MuiChartsAxis-line': {
              stroke: theme.palette.divider,
            },
            '.MuiAreaElement-root': {
              fill: `${theme.palette.primary.main}20`,
            },
            '.MuiChartsAxis-tickLabel': {
              transform: 'translate(0, 8px)',
            },
          }}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
          aria-label="Mood trend over time"
        />
        {showNavigationControls && totalPages > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
              py: 1,
            }}
          >
            <Tooltip title="Previous page">
              <IconButton
                size="small"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showDateMenu ? (
                <Button
                  size="small"
                  startIcon={<CalendarMonthIcon />}
                  onClick={handleMenuClick}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {dateRangeText || `${currentPage + 1} of ${totalPages}`}
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {dateRangeText || `${currentPage + 1} of ${totalPages}`}
                </Typography>
              )}
              {currentTimeRange && (
                <Chip
                  label={currentTimeRange}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 24 }}
                />
              )}
            </Box>
            <Tooltip title="Next page">
              <IconButton
                size="small"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {showDateMenu && (
          <Menu
            id={id}
            anchorEl={menuAnchor}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
          >
            <MenuItem onClick={() => navigateToLastWeek()}>
              <ListItemIcon>
                <ViewWeekIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Last Week</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => navigateToLastMonth()}>
              <ListItemIcon>
                <DateRangeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Last Month</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => navigateToLastThreeMonths()}>
              <ListItemIcon>
                <DateRangeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Last 3 Months</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => navigateToLastSixMonths()}>
              <ListItemIcon>
                <DateRangeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Last 6 Months</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => navigateToLastYear()}>
              <ListItemIcon>
                <DateRangeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Last Year</ListItemText>
            </MenuItem>
          </Menu>
        )}
      </Box>
    </Paper>
  );
};

export default MoodTrendChart;
