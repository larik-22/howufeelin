import { Box, Typography, useTheme } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

const HEART_COUNT = 12;

export default function BirthdayBanner() {
  const theme = useTheme();

  // Build a soft pink-to-white gradient reminiscent of iOS system banners
  const basePink = theme.palette.primary.light; // #FFD1DB
  const gradient = `linear-gradient(90deg, ${lighten(basePink, 0.6)} 0%, ${lighten(
    basePink,
    0.9
  )} 100%)`;

  // Randomised hearts (runs once)
  const hearts = useMemo(() => {
    interface HeartPos {
      id: number;
      top: number; // percentage
      left: number; // percentage
      size: number;
      delay: number;
    }

    const arr: HeartPos[] = [];
    const minDist = 10; // minimal euclidean distance in percentage units to avoid overlap

    const isTooClose = (a: HeartPos, b: HeartPos) => {
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      return Math.sqrt(dx * dx + dy * dy) < minDist;
    };

    let attempt = 0;
    while (arr.length < HEART_COUNT && attempt < HEART_COUNT * 20) {
      attempt += 1;
      const left = Math.random() * 100;
      if (left > 30 && left < 70) continue; // safe zone for text

      const top = Math.random() * 60;
      const candidate: HeartPos = {
        id: arr.length,
        top,
        left,
        size: 10 + Math.random() * 8,
        delay: Math.random() * 2,
      };

      // Ensure it doesn't overlap existing hearts
      if (arr.every(existing => !isTooClose(candidate, existing))) {
        arr.push(candidate);
      }
    }

    return arr;
  }, []);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: theme.zIndex.appBar + 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 1.2,
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        backgroundImage: gradient,
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.08)}`,
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
      }}
    >
      {/* Floating hearts in the background */}
      {hearts.map(h => (
        <motion.span
          key={h.id}
          initial={{ y: 0, opacity: 0.5 }}
          animate={{ y: [0, -6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 4 + Math.random() * 2,
            ease: 'easeInOut',
            delay: h.delay,
          }}
          style={{
            position: 'absolute',
            top: `${h.top}%`,
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            pointerEvents: 'none',
            opacity: 0.12,
            zIndex: 0,
          }}
        >
          🤍
        </motion.span>
      ))}

      {/* Banner message */}
      <Typography
        variant="subtitle1"
        sx={{
          position: 'relative',
          zIndex: 1,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: theme.palette.primary.contrastText,
          textShadow: `0 1px 2px ${alpha(theme.palette.common.white, 0.8)}`,
        }}
      >
        Happy Birthday, Rizel 🎂
      </Typography>
    </Box>
  );
}
