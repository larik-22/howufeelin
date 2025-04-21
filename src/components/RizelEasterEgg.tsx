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
  useMediaQuery,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';
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

// Pulse animation
const pulse = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

// Glow animation
const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 105, 180, 0.5), 0 0 10px rgba(255, 105, 180, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 105, 180, 0.8), 0 0 30px rgba(255, 105, 180, 0.5); }
  100% { box-shadow: 0 0 5px rgba(255, 105, 180, 0.5), 0 0 10px rgba(255, 105, 180, 0.3); }
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

const messages = ['Hi Rizel! 💖'];

interface RizelEasterEggProps {
  open: boolean;
  onClose: () => void;
}

export default function RizelEasterEgg({ open, onClose }: RizelEasterEggProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        const colors = ['#ff69b4', '#ff1493', '#ff69b4', '#ff1493'];

        // Create heart shape for confetti
        const heartShape = confetti.shapeFromPath({
          path: 'M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402m5.726-20.583c-2.203 0-4.446 1.042-5.726 3.238-1.285-2.206-3.522-3.248-5.719-3.248-3.183 0-6.281 2.187-6.281 6.191 0 4.661 5.571 9.429 12 15.809 6.43-6.38 12-11.148 12-15.809 0-4.011-3.095-6.181-6.274-6.181',
        });

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            shapes: [heartShape],
            scalar: 1.5,
            ticks: 200,
            gravity: 0.8,
            drift: 0,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            shapes: [heartShape],
            scalar: 1.5,
            ticks: 200,
            gravity: 0.8,
            drift: 0,
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
    <Fade in={open} timeout={300}>
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          right: isMobile ? 'auto' : 0,
          left: isMobile ? '50%' : 'auto',
          top: '100%',
          transform: isMobile ? 'translateX(-50%)' : 'none',
          p: 3,
          mt: 1,
          width: isMobile ? 'calc(100% - 32px)' : 320,
          minWidth: 280,
          maxWidth: 320,
          borderRadius: 4,
          // Cross-browser compatible glassmorphism with pink glow
          background:
            theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          animation: `${glow} 3s ease-in-out infinite`,
          zIndex: 9999,
          overflow: 'hidden',
          border: `1px solid ${
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }`,
          // Add a subtle gradient overlay for better glassmorphism effect
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255,105,180,0.1) 0%, rgba(255,255,255,0) 100%)'
                : 'linear-gradient(135deg, rgba(255,105,180,0.2) 0%, rgba(255,255,255,0) 100%)',
            zIndex: 0,
            pointerEvents: 'none',
          },
          // Add a pink glow effect
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -10,
            left: -10,
            right: -10,
            bottom: -10,
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,105,180,0.2), transparent 70%)',
            filter: 'blur(10px)',
            zIndex: -1,
            pointerEvents: 'none',
          },
        }}
      >
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: theme.palette.text.secondary,
            zIndex: 2,
            '&:hover': {
              color: theme.palette.primary.main,
              transform: 'rotate(90deg)',
              transition: 'all 0.3s ease',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

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
                color: theme.palette.text.primary,
                fontWeight: 600,
                mb: 1,
                textShadow:
                  theme.palette.mode === 'dark'
                    ? '0 1px 2px rgba(0,0,0,0.5)'
                    : '0 1px 2px rgba(255,255,255,0.5)',
                fontSize: '1.25rem',
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
                opacity: 0.9,
                fontSize: '0.875rem',
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
                fontSize: '0.875rem',
                px: 3,
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
                animation: `${pulse} 2s ease-in-out infinite`,
              }}
            />
          )}
        </Box>
      </Paper>
    </Fade>
  );
}
