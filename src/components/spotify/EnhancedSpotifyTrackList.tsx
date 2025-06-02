import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Skeleton,
} from '@mui/material';
import { Sort } from '@mui/icons-material';
import { FilterList, ViewList, ViewModule, ExpandMore } from '@mui/icons-material';
import { SongCard } from './SongCard';
import { SpotifySearchBar } from './SpotifySearchBar';
import {
  SpotifyTrack,
  SpotifySearchService,
  SearchResults,
  SpotifyPlaylist,
} from '@/services/spotify/search';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';

interface EnhancedSpotifyTrackListProps {
  selectedTrack: SpotifyTrack | null;
  onTrackSelect: (track: SpotifyTrack) => void;
}

type ViewMode = 'recent' | 'top' | 'saved' | 'playlists' | 'search';
type SortBy = 'name' | 'artist' | 'album' | 'popularity' | 'duration';
type SortOrder = 'asc' | 'desc';

export const EnhancedSpotifyTrackList = ({
  selectedTrack,
  onTrackSelect,
}: EnhancedSpotifyTrackListProps) => {
  const theme = useTheme();
  const { client, updateAuthenticationState } = useSpotify();

  // Services
  const [searchService, setSearchService] = useState<SpotifySearchService | null>(null);

  // View state
  const [currentView, setCurrentView] = useState<ViewMode>('recent');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Data state
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    tracks: [],
    total: 0,
    hasMore: false,
    offset: 0,
  });

  // Loading and error state
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // UI state
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);

  // Initialize search service
  useEffect(() => {
    if (client) {
      setSearchService(new SpotifySearchService(client));
    }
  }, [client]);

  // Sort tracks
  const sortedTracks = useMemo(() => {
    const tracksToSort = isSearchMode ? searchResults.tracks : tracks;

    return [...tracksToSort].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'artist':
          compareValue = a.artists[0]?.localeCompare(b.artists[0]) || 0;
          break;
        case 'album':
          compareValue = a.album.localeCompare(b.album);
          break;
        case 'popularity':
          compareValue = (b.popularity || 0) - (a.popularity || 0);
          break;
        case 'duration':
          compareValue = a.duration - b.duration;
          break;
      }

      return sortOrder === 'desc' ? -compareValue : compareValue;
    });
  }, [tracks, searchResults.tracks, isSearchMode, sortBy, sortOrder]);

  // Load tracks based on current view
  const loadTracks = useCallback(
    async (reset = false) => {
      if (!searchService) return;

      const newOffset = reset ? 0 : offset;
      setLoading(reset);
      setLoadingMore(!reset);
      setError(null);

      try {
        updateAuthenticationState(true);

        let newTracks: SpotifyTrack[] = [];
        let newHasMore = false;

        switch (currentView) {
          case 'recent':
            newTracks = await searchService.getRecentlyPlayed(20);
            newHasMore = false; // Recently played doesn't support pagination in our implementation
            break;

          case 'top':
            newTracks = await searchService.getTopTracks(20);
            newHasMore = false; // Top tracks limited to 20
            break;

          case 'saved': {
            const savedResults = await searchService.getSavedTracks(20, newOffset);
            newTracks = savedResults.tracks;
            newHasMore = savedResults.hasMore;
            break;
          }

          case 'playlists':
            if (!selectedPlaylist) {
              // Load playlists
              const playlistResults = await searchService.getUserPlaylists(20, 0);
              setPlaylists(playlistResults.playlists);
              return;
            } else {
              // Load tracks from selected playlist
              const playlistTracks = await searchService.getPlaylistTracks(
                selectedPlaylist.id,
                20,
                newOffset
              );
              newTracks = playlistTracks.tracks;
              newHasMore = playlistTracks.hasMore;
            }
            break;
        }

        if (reset) {
          setTracks(newTracks);
          setOffset(newTracks.length);
        } else {
          setTracks(prev => [...prev, ...newTracks]);
          setOffset(prev => prev + newTracks.length);
        }

        setHasMore(newHasMore);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tracks';
        setError(errorMessage);
        console.error('Error loading tracks:', err);

        if (
          (err instanceof Error && err.message.includes('403')) ||
          (err instanceof Error && err.message.includes('401'))
        ) {
          updateAuthenticationState(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchService, currentView, offset, selectedPlaylist, updateAuthenticationState]
  );

  // Load tracks when view changes
  useEffect(() => {
    if (searchService && !isSearchMode) {
      loadTracks(true);
    }
  }, [searchService, currentView, selectedPlaylist, isSearchMode]);

  // Handle search results
  const handleSearchResults = useCallback((results: SearchResults) => {
    setSearchResults(results);
  }, []);

  // Handle search state change
  const handleSearchStateChange = useCallback(
    (searching: boolean, query: string) => {
      setIsSearchMode(searching || !!query.trim());
      if (!searching && !query.trim()) {
        // Return to previous view when search is cleared
        loadTracks(true);
      }
    },
    [loadTracks]
  );

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: ViewMode) => {
    setCurrentView(newValue);
    setSelectedPlaylist(null);
    setOffset(0);
    setIsSearchMode(false);
  };

  // Handle playlist selection
  const handlePlaylistSelect = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    setOffset(0);
  };

  // Handle sort
  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setSortMenuAnchor(null);
  };

  const getTabLabel = (tab: ViewMode) => {
    switch (tab) {
      case 'recent':
        return 'Recent';
      case 'top':
        return 'Top Tracks';
      case 'saved':
        return 'Liked';
      case 'playlists':
        return 'Playlists';
      case 'search':
        return 'Search';
      default:
        return tab;
    }
  };

  const getEmptyMessage = (view: ViewMode) => {
    switch (view) {
      case 'recent':
        return 'No recently played tracks found. Start listening to music on Spotify!';
      case 'top':
        return 'No top tracks found. Listen to more music to build your top tracks!';
      case 'saved':
        return 'No liked songs found. Like some songs on Spotify to see them here!';
      case 'playlists':
        return selectedPlaylist
          ? 'This playlist is empty or contains no playable tracks.'
          : 'No playlists found. Create some playlists on Spotify!';
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
        Please connect to Spotify to browse and select songs.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <SpotifySearchBar
          onSearchResults={handleSearchResults}
          onSearchStateChange={handleSearchStateChange}
          placeholder="Search for your perfect song..."
        />
      </Box>

      {/* View Mode Tabs */}
      {!isSearchMode && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={currentView}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 600,
                textTransform: 'none',
                minHeight: { xs: 42, sm: 48 },
                px: { xs: 2, sm: 3 },
              },
            }}
          >
            <Tab label={getTabLabel('recent')} value="recent" />
            <Tab label={getTabLabel('top')} value="top" />
            <Tab label={getTabLabel('saved')} value="saved" />
            <Tab label={getTabLabel('playlists')} value="playlists" />
          </Tabs>
        </Box>
      )}

      {/* Playlist Selection */}
      {currentView === 'playlists' && !selectedPlaylist && !isSearchMode && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a playlist to browse:
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
              ))}
            </Box>
          ) : playlists.length > 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              {playlists.map(playlist => (
                <Box
                  key={playlist.id}
                  onClick={() => handlePlaylistSelect(playlist)}
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {playlist.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {playlist.trackCount} tracks
                    {playlist.description && ` • ${playlist.description}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info">{getEmptyMessage('playlists')}</Alert>
          )}
        </Box>
      )}

      {/* Current Context Header */}
      {((currentView !== 'playlists' || selectedPlaylist) && !isSearchMode) || isSearchMode ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {isSearchMode
                ? 'Search Results'
                : selectedPlaylist
                ? selectedPlaylist.name
                : getTabLabel(currentView)}
            </Typography>

            {(sortedTracks.length > 0 || isSearchMode) && (
              <Chip
                label={isSearchMode ? searchResults.total : sortedTracks.length}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>

          {/* Sort Controls */}
          {sortedTracks.length > 1 && (
            <IconButton
              size="small"
              onClick={e => setSortMenuAnchor(e.currentTarget)}
              sx={{ color: 'text.secondary' }}
            >
              <Sort fontSize="small" />
            </IconButton>
          )}
        </Box>
      ) : null}

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {(['name', 'artist', 'album', 'popularity', 'duration'] as SortBy[]).map(option => (
          <MenuItem key={option} onClick={() => handleSort(option)}>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {option} {sortBy === option && (sortOrder === 'asc' ? '↑' : '↓')}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, gap: 2 }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading tracks...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
          {error}
          <Box sx={{ mt: 1 }}>
            <Button size="small" onClick={() => loadTracks(true)}>
              Try Again
            </Button>
          </Box>
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && sortedTracks.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 1 }}>
          {isSearchMode
            ? 'No songs found. Try searching for something else!'
            : getEmptyMessage(currentView)}
        </Alert>
      )}

      {/* Track List */}
      {!loading && !error && sortedTracks.length > 0 && (
        <Box>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            {sortedTracks.map((track, index) => (
              <Box key={`${track.id}-${index}`}>
                <SongCard
                  track={track}
                  isSelected={selectedTrack?.id === track.id}
                  onSelect={onTrackSelect}
                />
                {index < sortedTracks.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>

          {/* Load More Button */}
          {hasMore && !isSearchMode && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => loadTracks(false)}
                disabled={loadingMore}
                startIcon={loadingMore ? <CircularProgress size={16} /> : undefined}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {loadingMore ? 'Loading...' : 'Load More Tracks'}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
