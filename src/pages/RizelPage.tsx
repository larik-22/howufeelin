import { Box, Typography, useTheme } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useInView } from 'react-intersection-observer';

// Import only Playfair Display font
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';

const cuteWords = [
  'So slay...',
  'So kind',
  'So beautiful',
  'So pretty',
  'So amazing',
  'So talented',
  'So smart',
  'So psychic',
  'So badass',
  'So cool',
  'SO SWAGGY',
  'So inspiring',
  'So positive',
  'So hard-working',
  'So determined',
  'So focused',
  'So disciplined',
  'So dedicated',
  'So gorgeous',
  'So attentive',
  'So empathetic',
  'So supportive',
  'So understanding',
  'So wise',
  'So charming',
  'So adorable',
  'So thoughtful',
  'So creative',
  'So brilliant',
  'So generous',
  'So gorgeous',
  'So radiant',
  'So iconic',
  'So legendary',
  'So incredible',
  'So magical',
  'So graceful',
  'So fearless',
  'So delightful',
  'So joyful',
  'So vibrant',
  'So sweet',
  'So precious',
  'So uplifting',
  'So genuine',
  'So authentic',
  'So passionate',
  'So extraordinary',
  'So warm',
];

interface WordItem {
  id: number;
  word: string;
  x: number;
  y: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.25, ease: 'easeOut' },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.5, y: 60 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
};

const WordComponent = ({ word, x }: { word: string; x: number }) => {
  const theme = useTheme();
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    controls.start(inView ? 'show' : 'hidden');
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      initial="hidden"
      animate={controls}
      style={{ position: 'relative', left: x, marginBottom: '5rem' }}
    >
      <Typography
        variant="h3"
        sx={{
          color: theme.palette.primary.main,
          fontWeight: 500,
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          fontSize: { xs: '1.75rem', sm: '2.75rem' },
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'transform 0.4s ease, text-shadow 0.4s ease',
          '&:hover': {
            transform: 'scale(1.08) translateY(-4px)',
            textShadow: '0 6px 25px rgba(0,0,0,0.12)',
          },
        }}
      >
        {word}
      </Typography>
    </motion.div>
  );
};

export default function RizelPage() {
  const theme = useTheme();
  const [items, setItems] = useState<WordItem[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [lastId, setLastId] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload fonts
  useEffect(() => {
    const preloadFonts = async () => {
      try {
        // Create a hidden element to force font loading
        const testElement = document.createElement('div');
        testElement.style.position = 'absolute';
        testElement.style.visibility = 'hidden';
        testElement.style.fontFamily = '"Playfair Display"';
        testElement.textContent = 'Font loading test';
        document.body.appendChild(testElement);

        // Wait for fonts to load
        await document.fonts.ready;

        // Remove test element
        document.body.removeChild(testElement);

        // Set fonts as loaded
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Fallback: set fonts as loaded after a timeout
        setTimeout(() => setFontsLoaded(true), 1000);
      }
    };

    preloadFonts();
  }, []);

  // Measure container width accurately
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 40); // account for side padding
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const measureTextWidth = (text: string, size: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    ctx.font = `${size}px "Helvetica Neue", Helvetica, Arial, serif`;
    return ctx.measureText(text).width;
  };

  const findFittingWord = (max: number, size: number) => {
    const shuffled = [...cuteWords].sort(() => Math.random() - 0.5);
    for (const w of shuffled) if (measureTextWidth(w, size) <= max) return w;
    return shuffled[0];
  };

  const generateItems = () => {
    const newArr: WordItem[] = [];
    const isMobile = containerWidth < 600;
    const fontSize = (isMobile ? 1.75 : 2.75) * 16;
    const padding = isMobile ? 40 : 60;
    const maxX = containerWidth - padding;

    for (let i = 0; i < 6; i++) {
      const id = lastId + i + 1;
      const word = findFittingWord(maxX - padding, fontSize);
      const width = measureTextWidth(word, fontSize);
      const x = Math.random() * (maxX - width - padding) + padding;
      newArr.push({ id, word, x, y: 0 });
    }
    setLastId(prev => prev + 6);
    return newArr;
  };

  const fetchMore = () => setItems(prev => [...prev, ...generateItems()]);

  useEffect(() => {
    setItems(generateItems());
  }, [containerWidth]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        p: { xs: 2, sm: 6 },
        opacity: fontsLoaded ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      {/* First Section - 75vh height */}
      <Box
        sx={{
          height: '75vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Floating Hearts */}
        <motion.div
          style={{ position: 'absolute', top: '15%', left: '80%', fontSize: '6rem', opacity: 0.08 }}
          animate={{ y: [0, 30, 0], rotate: [0, 15, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Typography component="span">❤️</Typography>
        </motion.div>

        {/* Additional Floating Hearts */}
        <motion.div
          style={{ position: 'absolute', top: '25%', left: '15%', fontSize: '4rem', opacity: 0.1 }}
          animate={{ y: [0, -20, 0], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Typography component="span">❤️</Typography>
        </motion.div>

        <motion.div
          style={{ position: 'absolute', top: '60%', left: '70%', fontSize: '3rem', opacity: 0.12 }}
          animate={{ y: [0, 15, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Typography component="span">❤️</Typography>
        </motion.div>

        <motion.div
          style={{ position: 'absolute', top: '40%', left: '30%', fontSize: '5rem', opacity: 0.09 }}
          animate={{ y: [0, -25, 25, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Typography component="span">❤️</Typography>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute',
            top: '70%',
            left: '20%',
            fontSize: '3.5rem',
            opacity: 0.11,
          }}
          animate={{ y: [0, 10, -10, 0], rotate: [0, -12, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Typography component="span">❤️</Typography>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 300,
              fontSize: { xs: '2.5rem', sm: '4.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
              textShadow: '0 6px 30px rgba(0,0,0,0.1)',
            }}
          >
            You are ...
          </Typography>
        </motion.div>

        {/* Scroll Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{ textAlign: 'center', marginTop: '1rem' }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              opacity: 0.8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.9rem',
              color: theme.palette.primary.main,
            }}
          >
            Scroll
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: [0, 15, 0],
              }}
              transition={{
                delay: 0.8,
                duration: 0.5,
                y: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{
                display: 'block',
                fontSize: '3rem',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                textShadow: `0 0 10px ${theme.palette.primary.light}`,
                marginTop: '0.5rem',
              }}
            >
              ↓
            </motion.span>
          </Typography>
        </motion.div>
      </Box>

      {/* Words List */}
      <InfiniteScroll
        dataLength={items.length}
        next={fetchMore}
        hasMore
        loader={
          <Typography
            align="center"
            sx={{
              mt: 4,
              opacity: 0.7,
              letterSpacing: '0.05em',
              color: theme.palette.primary.main,
            }}
          >
            Loading more...
          </Typography>
        }
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
        >
          {items.map(i => (
            <WordComponent key={i.id} word={i.word} x={i.x} />
          ))}
        </motion.div>
      </InfiniteScroll>
    </Box>
  );
}
