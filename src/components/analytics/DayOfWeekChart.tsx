import { useState, useEffect } from 'react';
import { Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { MoodPattern } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';

interface DayOfWeekChartProps {
  patterns: MoodPattern[];
  title?: string;
  height?: number;
}

interface ChartDataPoint {
  day: string;
  rating: number;
  count: number;
}

export default function DayOfWeekChart({
  patterns,
  title = 'Mood by Day of Week',
  height = 300,
}: DayOfWeekChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Format data for the chart
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedData = patterns.map(pattern => ({
      day: dayNames[pattern.dayOfWeek],
      rating: Number(pattern.averageRating.toFixed(1)),
      count: pattern.count,
    }));

    setData(formattedData);
  }, [patterns]);

  if (patterns.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: isMobile ? height * 0.8 : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
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
        p: 3,
        height: isMobile ? height * 0.8 : height,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <div style={{ height: '85%', width: '100%' }}>
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
              data: data.map(d => d.day),
              scaleType: 'band',
              tickLabelStyle: {
                fontSize: isMobile ? 8 : 10,
                angle: isMobile ? -45 : 0,
              },
              tickSize: 0,
            },
          ]}
          yAxis={[
            {
              min: RATING_MIN,
              max: RATING_MAX,
              tickLabelStyle: { fontSize: isMobile ? 10 : 12 },
              tickSize: 0,
            },
          ]}
          height={(isMobile ? height * 0.8 : height) * 0.85}
          margin={{ top: 10, right: 30, left: 20, bottom: isMobile ? 50 : 30 }}
          sx={{
            '.MuiBarElement-root': {
              rx: 4,
            },
            '.MuiChartsAxis-line': {
              stroke: theme.palette.divider,
            },
          }}
          slotProps={{
            legend: {
              hidden: isMobile,
            },
          }}
          aria-label="Mood patterns by day of week"
        />
      </div>
    </Paper>
  );
}
