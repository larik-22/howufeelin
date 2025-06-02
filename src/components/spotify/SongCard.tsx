import { Box, Typography, Avatar, IconButton, Chip, useTheme } from '@mui/material';
import { PlayArrow, Pause, CheckCircle } from '@mui/icons-material';
import { useState } from 'react';
import { SpotifyTrack } from '@/services/spotify/search';

interface SongCardProps {
  track: SpotifyTrack;
  isSelected?: boolean;
  onSelect: (track: SpotifyTrack) => void;
  onPreview?: (track: SpotifyTrack) => void;
  isPlaying?: boolean;
}

export const SongCard = ({
  track,
  isSelected = false,
  onSelect,
  onPreview,
  isPlaying = false,
}: SongCardProps) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(track);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        cursor: 'pointer',
        borderRadius: 1,
        transition: 'all 0.2s ease',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        border: isSelected ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
          borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(track)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
        {/* Album Art */}
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={track.albumImageUrl || undefined}
            variant="rounded"
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              bgcolor: 'grey.200',
              fontSize: '1.2rem',
            }}
          >
            ♪
          </Avatar>

          {/* Preview Button Overlay */}
          {track.previewUrl && (
            <IconButton
              size="small"
              onClick={handlePreviewClick}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                width: 32,
                height: 32,
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.9)',
                },
              }}
            >
              {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
            </IconButton>
          )}
        </Box>

        {/* Track Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              color: 'text.primary',
            }}
          >
            {track.name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.secondary',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
            }}
          >
            {track.artists.join(', ')}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
            }}
          >
            {track.album}
          </Typography>
        </Box>

        {/* Duration and Selection */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
            }}
          >
            {formatDuration(track.duration)}
          </Typography>

          {isSelected && (
            <Chip
              icon={<CheckCircle />}
              label="Selected"
              size="small"
              color="primary"
              variant="filled"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
