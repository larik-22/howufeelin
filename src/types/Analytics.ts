import { Rating } from './Rating';

export interface MoodTrend {
  date: string;
  averageRating: number;
  count: number;
}

export interface MoodPattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  averageRating: number;
  count: number;
}

export interface TimeOfDayPattern {
  hour: number; // 0-23
  averageRating: number;
  count: number;
}

export interface MoodInsights {
  overallAverage: number;
  highestMood: number;
  lowestMood: number;
  moodVolatility: number; // Standard deviation
  streakDays: number;
  totalEntries: number;
  moodTrends: MoodTrend[];
  dayOfWeekPatterns: MoodPattern[];
  timeOfDayPatterns: TimeOfDayPattern[];
  recentRatings: Rating[];
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export type TimeRange = 'week' | 'month' | 'year' | 'all' | 'custom';
