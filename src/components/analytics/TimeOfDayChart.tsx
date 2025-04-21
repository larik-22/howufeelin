import { useState, useEffect } from 'react';
import { Typography, Paper, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { TimeOfDayPattern } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';

interface TimeOfDayChartProps {
  patterns: TimeOfDayPattern[];
  title?: string;
  height?: number;
}

interface ChartDataPoint {
  hour: string;
  rating: number;
  count: number;
}

export default function TimeOfDayChart({
  patterns,
  title = 'Time of Day Patterns',
  height = 300,
}: TimeOfDayChartProps) {
  const theme = useTheme();
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Format data for the chart
    const formattedData = patterns.map(pattern => ({
      hour: `${pattern.hour}:00`,
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
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No time of day pattern data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height,
        bgcolor: 'background.paper',
        borderRadius: 2,
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
            },
          ]}
          xAxis={[
            {
              data: data.map(d => d.hour),
              scaleType: 'band',
              tickLabelStyle: { fontSize: 12 },
              tickSize: 0,
            },
          ]}
          yAxis={[
            {
              min: RATING_MIN,
              max: RATING_MAX,
              tickLabelStyle: { fontSize: 12 },
              tickSize: 0,
            },
          ]}
          height={height * 0.85}
          margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          sx={{
            '.MuiBarElement-root': {
              rx: 4,
            },
            '.MuiChartsAxis-line': {
              stroke: theme.palette.divider,
            },
          }}
        />
      </div>
    </Paper>
  );
}
