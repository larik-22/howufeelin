import { useState } from 'react';
import {
  Box,
  Collapse,
  Button,
  Typography,
  Avatar,
  useTheme,
  Paper,
  Chip,
  alpha,
} from '@mui/material';
import { ExpandMore, LibraryMusic, MusicNote, CheckCircle } from '@mui/icons-material';
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
          p: 4,
          borderRadius: 2,
          border: `1px dashed ${theme.palette.divider}`,
          bgcolor: 'background.default',
          textAlign: 'center',
          transition: 'all 0.15s ease-out',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <LibraryMusic />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
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
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.primary.main}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            position: 'relative',
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
            <CheckCircle />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 4 }}>
            <Avatar
              src={selectedTrack.albumImageUrl || undefined}
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'grey.100',
                borderRadius: 1.5,
              }}
            >
              <MusicNote sx={{ color: 'text.secondary' }} />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Chip
                label="Song of the Day"
                size="small"
                color="primary"
                variant="filled"
                sx={{ mb: 1.5, fontSize: '0.7rem', borderRadius: 1 }}
              />

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.primary',
                }}
              >
                {selectedTrack.name}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                by {selectedTrack.artists.join(', ')}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  opacity: 0.7,
                }}
              >
                from {selectedTrack.album}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                px: 2.5,
                py: 0.75,
                borderRadius: 1.5,
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              Change Song
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleClearSelection}
              sx={{
                color: 'text.secondary',
                px: 2,
                py: 0.75,
                borderRadius: 1.5,
                fontSize: '0.875rem',
                '&:hover': {
                  color: 'error.main',
                },
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
            py: 2.5,
            justifyContent: 'space-between',
            textTransform: 'none',
            fontWeight: 500,
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: 'divider',
            color: 'text.secondary',
            borderRadius: 2,
            transition: 'all 0.15s ease-out',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderStyle: 'solid',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MusicNote />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Choose Your Song of the Day
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                Browse your Spotify library
              </Typography>
            </Box>
          </Box>
          <ExpandMore
            sx={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease-out',
            }}
          />
        </Button>
      )}

      {/* Expandable Track Selection */}
      <Collapse in={isExpanded} timeout={200}>
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              px: 3,
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}
            >
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
