import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Fade,
  Zoom,
  keyframes,
  styled,
  Button,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { useTheme } from '@mui/material/styles';
import confetti from 'canvas-confetti';
import { Link } from 'react-router';
// Cute floating animation
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

// Heartbeat animation
const heartbeat = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.1); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

// Styled components
const FloatingIcon = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  animation: `${float} 3s ease-in-out infinite`,
  color: theme.palette.primary.main,
  fontSize: '1.5rem',
  '&:hover': {
    transform: 'scale(1.2)',
    transition: 'transform 0.3s',
  },
  '& svg': {
    fontSize: '1.5rem',
  },
}));

const HeartIcon = styled(FavoriteIcon)(({ theme }) => ({
  animation: `${heartbeat} 1.5s ease-in-out infinite`,
  color: theme.palette.primary.main,
  fontSize: '2rem',
}));

const messages = [
  'Hi Rizel! 💖',
  "You're so slay 🎀",
  "You're beautiful 🌸",
  "You're incredible 🌟",
  "You're so smart 🧠",
  "You're so kind...",
  "You're talented 🎨",
  "You're so sweet 🍬",
  "You're wonderful 💫",
];

interface RizelEasterEggProps {
  open: boolean;
  onClose: () => void;
}

export default function RizelEasterEgg({ open, onClose }: RizelEasterEggProps) {
  const theme = useTheme();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      // Cycle through messages
      const messageInterval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % messages.length);
      }, 2000);

      // Show confetti after a delay
      const confettiTimeout = setTimeout(() => {
        setShowConfetti(true);
        // Fire confetti from both sides
        const end = Date.now() + 3000;
        const colors = ['#ff0000', '#ff69b4', '#ff1493', '#ff69b4'];

        (function frame() {
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }, 1000);

      return () => {
        clearInterval(messageInterval);
        clearTimeout(confettiTimeout);
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <Fade in={open}>
      <Paper
        sx={{
          position: 'absolute',
          right: 0,
          top: '100%',
          p: 3,
          mt: 1,
          minWidth: 250,
          maxWidth: 300,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}10, ${theme.palette.primary.main}20)`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', minHeight: 150 }}>
          {/* Floating icons - positioned around the content */}
          <FloatingIcon sx={{ top: 10, left: 10, animationDelay: '0s' }}>
            <StarIcon />
          </FloatingIcon>
          <FloatingIcon sx={{ top: 20, right: 10, animationDelay: '1s' }}>
            <EmojiEmotionsIcon />
          </FloatingIcon>

          {/* Main content */}
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1, mt: 2 }}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <HeartIcon sx={{ mb: 2 }} />
            </Zoom>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                mb: 1,
              }}
            >
              {messages[currentMessage]}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
                mb: 2,
              }}
            >
              You will defeat them all 💪
            </Typography>

            {/* Special page link */}
            <Button
              component={Link}
              to="/rizel"
              variant="contained"
              color="primary"
              size="small"
              onClick={onClose}
              sx={{
                borderRadius: 20,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s',
                },
              }}
            >
              Visit me 🥕
            </Button>
          </Box>

          {/* Confetti effect */}
          {showConfetti && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                background: `radial-gradient(circle at 50% 50%, ${theme.palette.primary.light}20, transparent 70%)`,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </Box>
      </Paper>
    </Fade>
  );
}
