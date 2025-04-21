import React from 'react';
import { useState, useEffect } from 'react';
import { Typography, Paper, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { MoodInsights } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';

export interface TimeOfDayChartProps {
  insights: MoodInsights;
  height: number;
  isMobile: boolean;
}

interface ChartDataPoint {
  hour: string;
  rating: number;
  count: number;
}

const TimeOfDayChart: React.FC<TimeOfDayChartProps> = ({ insights, height, isMobile }) => {
  const theme = useTheme();
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Format data for the chart
    const formattedData = insights.timeOfDayPatterns.map(pattern => ({
      hour: `${pattern.hour}:00`,
      rating: Number(pattern.averageRating.toFixed(1)),
      count: pattern.count,
    }));

    setData(formattedData);
  }, [insights.timeOfDayPatterns]);

  if (insights.timeOfDayPatterns.length === 0) {
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
        Time of Day Patterns
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
              tickLabelStyle: {
                fontSize: isMobile ? 10 : 12,
                angle: -45,
                textAnchor: 'end',
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
          height={height * 0.85}
          margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
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
};

export default TimeOfDayChart;
