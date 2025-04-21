import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import { useLoadingState } from '@/hooks/useLoadingState';

interface MoodInputProps {
  hasRatedToday: boolean;
  onSubmit: (rating: number, note: string) => Promise<void>;
  isLoading?: boolean;
}

export const MoodInput = ({ hasRatedToday, onSubmit, isLoading = false }: MoodInputProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [moodRating, setMoodRating] = useState<number>(7);
  const [moodNote, setMoodNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showMoodEmoji, setShowMoodEmoji] = useState<boolean>(false);

  // Use our custom loading state hooks
  const displayLoading = useLoadingState(isLoading, [hasRatedToday]);
  const displaySubmitting = useLoadingState(isSubmitting, [moodRating, moodNote]);

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2)
      return (
        <SentimentVeryDissatisfiedIcon fontSize={isMobile ? 'medium' : 'large'} color="error" />
      );
    if (rating <= 4)
      return <SentimentDissatisfiedIcon fontSize={isMobile ? 'medium' : 'large'} color="warning" />;
    if (rating <= 6)
      return <SentimentSatisfiedIcon fontSize={isMobile ? 'medium' : 'large'} color="info" />;
    if (rating <= 8)
      return <SentimentSatisfiedAltIcon fontSize={isMobile ? 'medium' : 'large'} color="primary" />;
    return <SentimentVerySatisfiedIcon fontSize={isMobile ? 'medium' : 'large'} color="success" />;
  };

  const getMoodColor = (rating: number) => {
    if (rating <= 2) return theme.palette.error.main;
    if (rating <= 4) return theme.palette.warning.main;
    if (rating <= 6) return theme.palette.info.main;
    if (rating <= 8) return theme.palette.primary.main;
    return theme.palette.success.main;
  };

  const getMoodLabel = (rating: number) => {
    if (rating <= 2) return 'Very Bad';
    if (rating <= 4) return 'Bad';
    if (rating <= 6) return 'Okay';
    if (rating <= 8) return 'Good';
    return 'Excellent';
  };

  const handleMoodRatingChange = (_event: Event, newValue: number | number[]) => {
    setMoodRating(newValue as number);
    setShowMoodEmoji(true);
    setTimeout(() => setShowMoodEmoji(false), 1500);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(moodRating, moodNote);
      setMoodNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        boxShadow: { xs: 1, sm: 3 },
        borderRadius: { xs: 1, sm: 2 },
        transition: 'all 0.3s ease',
        bgcolor: 'background.paper',
        '&:hover': {
          boxShadow: { xs: 2, sm: 4 },
        },
        opacity: displayLoading ? 0.7 : 1,
        pointerEvents: displayLoading ? 'none' : 'auto',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {displayLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography
              variant="h6"
              sx={{
                mb: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              How are you feeling today?
              <Box sx={{ position: 'relative', ml: 2 }}>
                <Fade in={showMoodEmoji} timeout={500}>
                  <Box sx={{ position: 'absolute', top: -10, left: 0 }}>
                    {getMoodEmoji(moodRating)}
                  </Box>
                </Fade>
              </Box>
            </Typography>

            {hasRatedToday ? (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: 1,
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  },
                }}
              >
                You've already rated your mood today. Come back tomorrow to rate again!
              </Alert>
            ) : (
              <>
                <Box sx={{ px: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                      px: { xs: 1, sm: 2 },
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Not great
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Amazing
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative', height: { xs: 80, sm: 50 } }}>
                    <Slider
                      value={moodRating}
                      onChange={handleMoodRatingChange}
                      aria-labelledby="mood-slider"
                      valueLabelDisplay="auto"
                      valueLabelFormat={value => `${value} - ${getMoodLabel(value)}`}
                      step={1}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 3, label: '3' },
                        { value: 5, label: '5' },
                        { value: 7, label: '7' },
                        { value: 10, label: '10' },
                      ]}
                      min={1}
                      max={10}
                      disabled={displaySubmitting}
                      sx={{
                        color: getMoodColor(moodRating),
                        '& .MuiSlider-thumb': {
                          width: { xs: 24, sm: 28 },
                          height: { xs: 24, sm: 28 },
                          transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                          '&:before': {
                            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                          },
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0px 0px 0px 8px rgba(143, 197, 163, 0.16)',
                          },
                          '&.Mui-active': {
                            width: { xs: 30, sm: 34 },
                            height: { xs: 30, sm: 34 },
                          },
                        },
                        '& .MuiSlider-rail': {
                          opacity: 0.28,
                          backgroundColor: theme.palette.grey[300],
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: 'transparent',
                          border: `2px solid ${getMoodColor(moodRating)}`,
                        },
                        '& .MuiSlider-mark': {
                          width: { xs: 1, sm: 2 },
                          height: { xs: 1, sm: 2 },
                          backgroundColor: 'transparent',
                        },
                        '& .MuiSlider-markLabel': {
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          color: theme.palette.text.secondary,
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: getMoodColor(moodRating),
                          color: theme.palette.common.white,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          '&:before': {
                            display: 'none',
                          },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: `${(moodRating - 1) * (100 / 9)}%`,
                        transform: 'translateX(-50%)',
                        transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                        pointerEvents: 'none',
                      }}
                    >
                      <Zoom in={showMoodEmoji} timeout={500}>
                        <Paper
                          elevation={3}
                          sx={{
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                            p: 0.5,
                            boxShadow: 2,
                            transform: { xs: 'scale(0.8)', sm: 'scale(1)' },
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          {getMoodEmoji(moodRating)}
                        </Paper>
                      </Zoom>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mt: { xs: 1, sm: 2 },
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: getMoodColor(moodRating),
                        fontWeight: 'bold',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      }}
                    >
                      {moodRating}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      - {getMoodLabel(moodRating)}
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Add a note (optional)"
                  variant="outlined"
                  value={moodNote}
                  onChange={e => setMoodNote(e.target.value)}
                  sx={{
                    mb: { xs: 1.5, sm: 2 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                  }}
                  placeholder="How was your day? What made you feel this way?"
                  disabled={displaySubmitting}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  fullWidth
                  disabled={displaySubmitting}
                  sx={{
                    py: { xs: 1, sm: 1.5 },
                    borderRadius: 1,
                    boxShadow: 3,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    bgcolor: getMoodColor(moodRating),
                    '&:hover': {
                      boxShadow: 5,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? `${getMoodColor(moodRating)}80`
                          : `${getMoodColor(moodRating)}CC`,
                    },
                    '&:disabled': {
                      boxShadow: 0,
                    },
                  }}
                >
                  {displaySubmitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Submitting...</span>
                    </Box>
                  ) : (
                    'Submit Mood'
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
