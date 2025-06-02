import { useState } from 'react';
import { Box, Collapse, Button, Typography, Avatar, useTheme, Paper, Chip } from '@mui/material';
import { ExpandMore, ExpandLess, LibraryMusic, MusicNote, CheckCircle } from '@mui/icons-material';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';
import { SpotifyAuthButton } from './SpotifyAuthButton';
import { SpotifyBrowser } from './SpotifyBrowser';
import { SpotifyTrack } from '@/services/spotify/search';

interface SongSelectorProps {
  selectedTrack: SpotifyTrack | null;
  onTrackSelect: (track: SpotifyTrack | null) => void;
}

export const SongSelector = ({ selectedTrack, onTrackSelect }: SongSelectorProps) => {
  const theme = useTheme();
  const { client, isAuthenticated } = useSpotify();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClearSelection = () => {
    onTrackSelect(null);
    setIsExpanded(false);
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    onTrackSelect(track);
    setIsExpanded(false); // Auto-collapse after selection for better UX
  };

  // If not authenticated, show auth section
  if (!client || !isAuthenticated) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
          border: `2px dashed ${theme.palette.divider}`,
          bgcolor: 'background.default',
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <LibraryMusic fontSize="large" />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Add Your Song of the Day
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
              Connect your Spotify account to browse your music library and select the perfect song
              that matches your mood.
            </Typography>
          </Box>

          <SpotifyAuthButton />
        </Box>
      </Paper>
    );
  }

  // Authenticated view
  return (
    <Box>
      {/* Selected Track Display */}
      {selectedTrack ? (
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            border: `1px solid ${theme.palette.primary.main}`,
            bgcolor: 'primary.50',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Success indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'primary.main',
            }}
          >
            <CheckCircle fontSize="small" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 4 }}>
            <Avatar
              src={selectedTrack.albumImageUrl || undefined}
              variant="rounded"
              sx={{
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                bgcolor: 'grey.200',
                fontSize: '1.5rem',
                boxShadow: 2,
              }}
            >
              ♪
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Chip
                label="Song of the Day"
                size="small"
                color="primary"
                sx={{ mb: 1, fontSize: '0.7rem' }}
              />

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  color: 'text.primary',
                }}
              >
                {selectedTrack.name}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 500,
                }}
              >
                by {selectedTrack.artists.join(', ')}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                from {selectedTrack.album}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                px: 3,
                borderRadius: 1.5,
              }}
            >
              Change Song
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleClearSelection}
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: 'text.secondary',
                minWidth: 'auto',
                px: 2,
              }}
            >
              Remove
            </Button>
          </Box>
        </Paper>
      ) : (
        /* Selection Button */
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            py: { xs: 2, sm: 3 },
            justifyContent: 'space-between',
            textTransform: 'none',
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 600,
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: 'divider',
            color: 'text.secondary',
            borderRadius: 2,
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
              bgcolor: 'action.hover',
              borderStyle: 'solid',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MusicNote />
            <Box sx={{ textAlign: 'left' }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}
              >
                Choose Your Song of the Day
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Browse your Spotify library
              </Typography>
            </Box>
          </Box>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </Button>
      )}

      {/* Expandable Track Selection */}
      <Collapse in={isExpanded} timeout={300}>
        <Paper
          elevation={2}
          sx={{
            mt: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.default',
              px: 3,
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Select Your Song
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a song that represents your mood today. You can search or browse your recent
              plays, top tracks, and liked songs.
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <SpotifyBrowser selectedTrack={selectedTrack} onTrackSelect={handleTrackSelect} />
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};
