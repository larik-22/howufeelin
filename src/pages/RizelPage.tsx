import { Box, Typography, Paper } from '@mui/material';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

export default function RizelPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <EmojiEmotionsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Rizel's Special Page
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This is a special page just for you! 🥕
        </Typography>
      </Paper>
    </Box>
  );
}
