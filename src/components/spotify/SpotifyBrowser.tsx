import { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { StandardizedSongList } from './StandardizedSongList';
import { SpotifySearchBar } from './SpotifySearchBar';
import { SpotifyTrack, SpotifySearchService, SearchResults } from '@/services/spotify/search';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';

interface SpotifyBrowserProps {
  selectedTrack: SpotifyTrack | null;
  onTrackSelect: (track: SpotifyTrack) => void;
}

type ViewMode = 'recent' | 'top' | 'saved' | 'search';

export const SpotifyBrowser = ({ selectedTrack, onTrackSelect }: SpotifyBrowserProps) => {
  const { client, updateAuthenticationState } = useSpotify();

  // Services
  const [searchService, setSearchService] = useState<SpotifySearchService | null>(null);

  // View state
  const [currentView, setCurrentView] = useState<ViewMode>('recent');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    tracks: [],
    total: 0,
    hasMore: false,
    offset: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;

  // Initialize search service
  useEffect(() => {
    if (client) {
      setSearchService(new SpotifySearchService(client));
    }
  }, [client]);

  // Load tracks for the current view and page
  const loadTracks = useCallback(
    async (page: number = 1, view: ViewMode = currentView) => {
      if (!searchService) return;

      setLoading(true);
      setError(null);

      try {
        updateAuthenticationState(true);

        let newTracks: SpotifyTrack[] = [];
        let newTotal = 0;

        switch (view) {
          case 'recent': {
            // Recent tracks - no pagination from Spotify API
            newTracks = await searchService.getRecentlyPlayed(50); // Get more to simulate pagination
            newTotal = newTracks.length;

            // Simulate pagination on client side
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            newTracks = newTracks.slice(startIndex, endIndex);
            break;
          }

          case 'top': {
            // Top tracks - no pagination from Spotify API
            newTracks = await searchService.getTopTracks(50); // Get more to simulate pagination
            newTotal = newTracks.length;

            // Simulate pagination on client side
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            newTracks = newTracks.slice(startIndex, endIndex);
            break;
          }

          case 'saved': {
            // Saved tracks - has real pagination
            const offset = (page - 1) * pageSize;
            const results = await searchService.getSavedTracks(pageSize, offset);
            newTracks = results.tracks;
            newTotal = results.total;
            break;
          }
        }

        setTracks(newTracks);
        setTotal(newTotal);
        setCurrentPage(page);
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
      }
    },
    [searchService, currentView, updateAuthenticationState]
  );

  // Load tracks when view changes
  useEffect(() => {
    if (searchService && !isSearchMode) {
      setCurrentPage(1);
      loadTracks(1, currentView);
    }
  }, [searchService, currentView, isSearchMode]);

  // Handle search results
  const handleSearchResults = useCallback((results: SearchResults) => {
    setSearchResults(results);
    setCurrentPage(1);
  }, []);

  // Handle search state change
  const handleSearchStateChange = useCallback(
    (searching: boolean, query: string) => {
      setIsSearchMode(searching || !!query.trim());
      setSearchQuery(query);

      if (!searching && !query.trim()) {
        // Return to previous view when search is cleared
        setCurrentPage(1);
        loadTracks(1, currentView);
      }
    },
    [loadTracks, currentView]
  );

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: ViewMode) => {
    setCurrentView(newValue);
    setIsSearchMode(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle page change for browsing modes
  const handlePageChange = useCallback(
    (page: number) => {
      if (isSearchMode) {
        // For search, we don't have server-side pagination implemented yet
        // Could be added later by modifying searchTracks to accept offset
        return;
      }

      loadTracks(page, currentView);
    },
    [loadTracks, currentView, isSearchMode]
  );

  const getTabLabel = (tab: ViewMode) => {
    switch (tab) {
      case 'recent':
        return 'Recent';
      case 'top':
        return 'Top Tracks';
      case 'saved':
        return 'Liked Songs';
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
      case 'search':
        return searchQuery
          ? `No results found for "${searchQuery}"`
          : 'Start typing to search for songs...';
      default:
        return 'No tracks found.';
    }
  };

  // Determine which tracks and total to show
  const displayTracks = isSearchMode ? searchResults.tracks : tracks;
  const displayTotal = isSearchMode ? searchResults.total : total;
  const showPagination = !isSearchMode; // Only show pagination for browsing modes

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

      {/* Browse Mode Tabs */}
      {!isSearchMode && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={currentView}
            onChange={handleTabChange}
            variant="fullWidth"
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
          </Tabs>
        </Box>
      )}

      {/* Current Context */}
      {(isSearchMode || displayTracks.length > 0) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {isSearchMode
              ? `Search results for "${searchQuery}"`
              : `Your ${getTabLabel(currentView).toLowerCase()}`}
          </Typography>
        </Box>
      )}

      {/* Standardized Song List */}
      <StandardizedSongList
        tracks={displayTracks}
        total={displayTotal}
        loading={loading}
        error={error}
        selectedTrack={selectedTrack}
        onTrackSelect={onTrackSelect}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        pageSize={pageSize}
        showPagination={showPagination}
        sortable={true}
        emptyMessage={getEmptyMessage(isSearchMode ? 'search' : currentView)}
      />
    </Box>
  );
};
