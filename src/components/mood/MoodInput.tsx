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
} from '@mui/material';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';

interface MoodInputProps {
  hasRatedToday: boolean;
  onSubmit: (rating: number, note: string) => Promise<void>;
}

export const MoodInput = ({ hasRatedToday, onSubmit }: MoodInputProps) => {
  const theme = useTheme();
  const [moodRating, setMoodRating] = useState<number>(5);
  const [moodNote, setMoodNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showMoodEmoji, setShowMoodEmoji] = useState<boolean>(false);

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return <SentimentVeryDissatisfiedIcon fontSize="large" color="error" />;
    if (rating <= 4) return <SentimentDissatisfiedIcon fontSize="large" color="warning" />;
    if (rating <= 6) return <SentimentSatisfiedIcon fontSize="large" color="info" />;
    if (rating <= 8) return <SentimentSatisfiedAltIcon fontSize="large" color="primary" />;
    return <SentimentVerySatisfiedIcon fontSize="large" color="success" />;
  };

  const getMoodColor = (rating: number) => {
    if (rating <= 2) return theme.palette.error.main;
    if (rating <= 4) return theme.palette.warning.main;
    if (rating <= 6) return theme.palette.info.main;
    if (rating <= 8) return theme.palette.primary.main;
    return theme.palette.success.main;
  };

  const handleMoodRatingChange = (_event: Event, newValue: number | number[]) => {
    setMoodRating(newValue as number);
    setShowMoodEmoji(true);
    setTimeout(() => setShowMoodEmoji(false), 1500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(moodRating, moodNote);
      setMoodNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          How are you feeling today?
          <Box sx={{ position: 'relative', ml: 2 }}>
            <Fade in={showMoodEmoji} timeout={500}>
              <Box sx={{ position: 'absolute', top: -10, left: 0 }}>{getMoodEmoji(moodRating)}</Box>
            </Fade>
          </Box>
        </Typography>

        {hasRatedToday ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            You've already rated your mood today. Come back tomorrow to rate again!
          </Alert>
        ) : (
          <>
            <Box sx={{ px: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Not great
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Amazing
                </Typography>
              </Box>
              <Box sx={{ position: 'relative', height: 80 }}>
                <Slider
                  value={moodRating}
                  onChange={handleMoodRatingChange}
                  aria-labelledby="mood-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={10}
                  sx={{
                    color: getMoodColor(moodRating),
                    '& .MuiSlider-thumb': {
                      width: 28,
                      height: 28,
                      transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                      '&:before': {
                        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                      },
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0px 0px 0px 8px rgba(143, 197, 163, 0.16)',
                      },
                      '&.Mui-active': {
                        width: 34,
                        height: 34,
                      },
                    },
                    '& .MuiSlider-rail': {
                      opacity: 0.28,
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
                    <Box
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                        p: 0.5,
                        boxShadow: 2,
                      }}
                    >
                      {getMoodEmoji(moodRating)}
                    </Box>
                  </Zoom>
                </Box>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  textAlign: 'center',
                  mt: 2,
                  color: getMoodColor(moodRating),
                  fontWeight: 'bold',
                }}
              >
                {moodRating}
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Add a note (optional)"
              variant="outlined"
              value={moodNote}
              onChange={e => setMoodNote(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="How was your day? What made you feel this way?"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                borderRadius: 2,
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 5,
                },
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Mood'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
