import React from 'react';
import { useState, useEffect } from 'react';
import { Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { MoodInsights } from '@/types/Analytics';
import { RATING_MIN, RATING_MAX } from '@/types/Rating';

export interface MoodTrendChartProps {
  insights: MoodInsights;
  height: number;
}

interface ChartDataPoint {
  date: string;
  rating: number;
  count: number;
}

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ insights, height }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Format data for the chart
    const formattedData = insights.moodTrends.map(trend => ({
      date: new Date(trend.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      rating: Number(trend.averageRating.toFixed(1)),
      count: trend.count,
    }));

    setData(formattedData);
  }, [insights.moodTrends]);

  if (insights.moodTrends.length === 0) {
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
        Mood Trends
      </Typography>
      <div style={{ height: '85%', width: '100%' }}>
        <LineChart
          series={[
            {
              data: data.map(d => d.rating),
              label: 'Mood Rating',
              color: theme.palette.primary.main,
              showMark: true,
              valueFormatter: value => `Rating: ${value}`,
            },
          ]}
          xAxis={[
            {
              data: data.map((_, index) => index),
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
          height={(isMobile ? height * 0.8 : height) * 0.85}
          margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
          sx={{
            '.MuiLineElement-root': {
              strokeWidth: 2,
            },
            '.MuiMarkElement-root': {
              stroke: theme.palette.primary.main,
              scale: '1.5',
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
          aria-label="Mood trend over time"
        />
      </div>
    </Paper>
  );
};

export default MoodTrendChart;
