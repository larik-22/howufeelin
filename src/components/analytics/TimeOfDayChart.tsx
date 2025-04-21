import React from 'react';
import { useState, useEffect } from 'react';
import { Typography, Paper, useTheme, useMediaQuery, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { MoodInsights } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';

export interface TimeOfDayChartProps {
  insights: MoodInsights;
  height: number;
  isMobile?: boolean;
}

interface ChartDataPoint {
  time: string;
  rating: number;
  count: number;
}

const TimeOfDayChart: React.FC<TimeOfDayChartProps> = ({
  insights,
  height,
  isMobile: isMobileProp,
}) => {
  const theme = useTheme();
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileBreakpoint;
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Format data for the chart
    const getTimePeriod = (hour: number): string => {
      if (hour >= 5 && hour < 12) return 'Morning';
      if (hour >= 12 && hour < 17) return 'Afternoon';
      if (hour >= 17 && hour < 22) return 'Evening';
      return 'Night';
    };

    // Group patterns by time period
    const timePeriods: Record<string, { sum: number; count: number }> = {
      Morning: { sum: 0, count: 0 },
      Afternoon: { sum: 0, count: 0 },
      Evening: { sum: 0, count: 0 },
      Night: { sum: 0, count: 0 },
    };

    // Process each time pattern
    insights.timeOfDayPatterns.forEach(pattern => {
      if (pattern && typeof pattern.hour === 'number') {
        const timePeriod = getTimePeriod(pattern.hour);
        timePeriods[timePeriod].sum += pattern.averageRating * pattern.count;
        timePeriods[timePeriod].count += pattern.count;
      }
    });

    // Calculate averages for each time period
    const formattedData = Object.entries(timePeriods).map(([time, { sum, count }]) => ({
      time,
      rating: count > 0 ? Number((sum / count).toFixed(1)) : 0,
      count,
    }));

    setData(formattedData);
  }, [insights.timeOfDayPatterns]);

  if (insights.timeOfDayPatterns.length === 0) {
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
          No time of day pattern data available
        </Typography>
      </Paper>
    );
  }

  // Calculate chart height based on mobile state
  const chartHeight = isMobile ? height * 0.65 : height * 0.85;

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
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: isMobile ? 1 : 1.5 }}>
        <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ mb: 0.5 }}>
          Time of Day Patterns
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
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
                width: 8,
                height: 8,
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
                width: 8,
                height: 8,
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
        <BarChart
          series={[
            {
              data: data.map(d => d.rating),
              label: 'Average Mood',
              color: theme.palette.primary.main,
              valueFormatter: value => `Rating: ${value}`,
            },
          ]}
          xAxis={[
            {
              data: data.map(d => d.time),
              scaleType: 'band',
              tickLabelStyle: {
                fontSize: isMobile ? 8 : 10,
                angle: 0,
                textAnchor: 'middle',
              },
              tickSize: 0,
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
            bottom: isMobile ? 50 : 60,
          }}
          sx={{
            '.MuiBarElement-root': {
              rx: 4,
              transition: 'all 0.3s ease',
              '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.02)',
              },
            },
            '.MuiChartsAxis-line': {
              stroke: theme.palette.divider,
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
          aria-label="Mood patterns by time of day"
        />
      </Box>
    </Paper>
  );
};

export default TimeOfDayChart;
