import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import { SongCard } from './SongCard';
import { SpotifyTrack, SpotifySearchService } from '@/services/spotify/search';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';

interface SpotifyTrackListProps {
  selectedTrack: SpotifyTrack | null;
  onTrackSelect: (track: SpotifyTrack) => void;
}

type TabValue = 'recent' | 'top' | 'saved';

export const SpotifyTrackList = ({ selectedTrack, onTrackSelect }: SpotifyTrackListProps) => {
  const theme = useTheme();
  const { client, updateAuthenticationState } = useSpotify();
  const [currentTab, setCurrentTab] = useState<TabValue>('recent');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchService, setSearchService] = useState<SpotifySearchService | null>(null);

  // Initialize search service when client is available
  useEffect(() => {
    if (client) {
      setSearchService(new SpotifySearchService(client));
    }
  }, [client]);

  const loadTracks = useCallback(async () => {
    if (!searchService) return;

    setLoading(true);
    setError(null);

    try {
      let newTracks: SpotifyTrack[] = [];

      switch (currentTab) {
        case 'recent':
          newTracks = await searchService.getRecentlyPlayed(20);
          break;
        case 'top':
          newTracks = await searchService.getTopTracks(20);
          break;
        case 'saved':
          newTracks = await searchService.getSavedTracks(20);
          break;
      }

      setTracks(newTracks);
      // If we successfully made API calls, update authentication state
      updateAuthenticationState(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tracks';
      setError(errorMessage);
      console.error('Error loading tracks:', err);

      // If API call failed, it might be an authentication issue
      if (
        (err instanceof Error && err.message.includes('403')) ||
        (err instanceof Error && err.message.includes('401'))
      ) {
        updateAuthenticationState(false);
      }
    } finally {
      setLoading(false);
    }
  }, [searchService, currentTab, updateAuthenticationState]);

  // Load tracks when tab changes or search service becomes available
  useEffect(() => {
    if (searchService) {
      loadTracks();
    }
  }, [searchService, loadTracks]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  const getTabLabel = (tab: TabValue) => {
    switch (tab) {
      case 'recent':
        return 'Recent';
      case 'top':
        return 'Top Tracks';
      case 'saved':
        return 'Favorites';
      default:
        return tab;
    }
  };

  const getEmptyMessage = (tab: TabValue) => {
    switch (tab) {
      case 'recent':
        return 'No recently played tracks found. Start listening to some music on Spotify!';
      case 'top':
        return 'No top tracks found. Listen to more music to see your favorites here!';
      case 'saved':
        return 'No saved tracks found. Like some songs on Spotify to see them here!';
      default:
        return 'No tracks found.';
    }
  };

  if (!client) {
    return (
      <Alert
        severity="info"
        sx={{
          borderRadius: 1,
          '& .MuiAlert-message': {
            fontSize: { xs: '0.875rem', sm: '1rem' },
          },
        }}
      >
        Please connect to Spotify to select your song of the day.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              fontWeight: 600,
              textTransform: 'none',
              minHeight: { xs: 42, sm: 48 },
              py: { xs: 1, sm: 1.5 },
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
            '& .MuiTabs-indicator': {
              height: 2,
            },
          }}
        >
          <Tab label={getTabLabel('recent')} value="recent" />
          <Tab label={getTabLabel('top')} value="top" />
          <Tab label={getTabLabel('saved')} value="saved" />
        </Tabs>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
            gap: 2,
          }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading {getTabLabel(currentTab).toLowerCase()}...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 1,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        >
          {error}
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                textDecoration: 'underline',
                color: 'error.dark',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              }}
              onClick={loadTracks}
            >
              Try again
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && tracks.length === 0 && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 1,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        >
          {getEmptyMessage(currentTab)}
        </Alert>
      )}

      {/* Track List */}
      {!loading && !error && tracks.length > 0 && (
        <Box
          sx={{
            maxHeight: { xs: 300, sm: 400 },
            overflowY: 'auto',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          {tracks.map((track, index) => (
            <Box key={track.id}>
              <SongCard
                track={track}
                isSelected={selectedTrack?.id === track.id}
                onSelect={onTrackSelect}
              />
              {index < tracks.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
