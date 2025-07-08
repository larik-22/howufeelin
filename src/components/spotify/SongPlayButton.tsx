import { useState } from 'react';
import { IconButton, Tooltip, CircularProgress, Alert, Snackbar } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PremiumIcon from '@mui/icons-material/Stars';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';

interface SongPlayButtonProps {
  trackUri: string;
  trackName?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const SongPlayButton = ({
  trackUri,
  trackName = 'this track',
  size = 'medium',
  disabled = false,
}: SongPlayButtonProps) => {
  const { isAuthenticated, playerState, playTrack, pausePlayback, resumePlayback, connectSpotify } =
    useSpotify();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if this track is currently playing
  const isCurrentTrack = playerState.currentTrack?.uri === trackUri;
  const isPlaying = isCurrentTrack && playerState.isPlaying;

  const handlePlay = async () => {
    setError(null);

    // Check authentication first
    if (!isAuthenticated) {
      try {
        setIsLoading(true);
        await connectSpotify();
        return; // User will be redirected to authenticate
      } catch {
        setError('Please connect your Spotify account first');
        setIsLoading(false);
        return;
      }
    }

    // Check if player is ready
    if (!playerState.isReady) {
      if (playerState.isLoading) {
        setError('Spotify player is loading, please wait...');
        return;
      }

      if (!playerState.isPremium) {
        setError('Spotify Premium is required to play music');
        return;
      }

      setError('Spotify player is not ready. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      if (isCurrentTrack) {
        // If this track is currently playing, pause it
        if (isPlaying) {
          await pausePlayback();
        } else {
          // If this track is paused, resume it
          await resumePlayback();
        }
      } else {
        // Play the new track
        await playTrack(trackUri);
      }
    } catch (err) {
      console.error('Error controlling playback:', err);

      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('Premium')) {
          setError('Spotify Premium subscription required to play music');
        } else if (err.message.includes('device')) {
          setError('No active Spotify device found. Please open Spotify on another device.');
        } else if (err.message.includes('authentication')) {
          setError('Spotify authentication expired. Please reconnect.');
        } else {
          setError(`Failed to play ${trackName}: ${err.message}`);
        }
      } else {
        setError(`Failed to play ${trackName}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonIcon = () => {
    if (isLoading || playerState.isLoading) {
      return <CircularProgress size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />;
    }

    if (playerState.error && !playerState.isPremium) {
      return <PremiumIcon />;
    }

    if (error || playerState.error) {
      return <ErrorOutlineIcon />;
    }

    if (isCurrentTrack && isPlaying) {
      return <PauseIcon />;
    }

    return <PlayArrowIcon />;
  };

  const getTooltipText = () => {
    if (!isAuthenticated) {
      return 'Connect Spotify to play music';
    }

    if (playerState.isLoading) {
      return 'Loading Spotify player...';
    }

    if (!playerState.isPremium) {
      return 'Spotify Premium required';
    }

    if (!playerState.isReady) {
      return 'Spotify player not ready';
    }

    if (error) {
      return error;
    }

    if (playerState.error) {
      return playerState.error;
    }

    if (isCurrentTrack && isPlaying) {
      return `Pause ${trackName}`;
    }

    return `Play ${trackName}`;
  };

  const getButtonColor = () => {
    if (error || playerState.error) {
      return 'error';
    }

    if (!playerState.isPremium && playerState.error) {
      return 'warning';
    }

    if (isCurrentTrack && isPlaying) {
      return 'primary';
    }

    return 'default';
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Tooltip title={getTooltipText()}>
        <span>
          <IconButton
            onClick={handlePlay}
            disabled={disabled || isLoading}
            size={size}
            color={getButtonColor() as 'default' | 'primary' | 'error' | 'warning'}
            sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              },
              '&:disabled': {
                transform: 'none',
              },
            }}
          >
            {getButtonIcon()}
          </IconButton>
        </span>
      </Tooltip>

      {/* Error notification */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};
