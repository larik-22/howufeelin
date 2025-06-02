import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Fade,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Breadcrumbs,
  Link,
  alpha,
  useTheme,
} from '@mui/material';
import { ArrowBack, QueueMusic } from '@mui/icons-material';
import { StandardizedSongList } from './StandardizedSongList';
import { SpotifySearchBar } from './SpotifySearchBar';
import {
  SpotifyTrack,
  SpotifySearchService,
  SearchResults,
  SpotifyPlaylist,
} from '@/services/spotify/search';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';

interface SpotifyBrowserProps {
  selectedTrack: SpotifyTrack | null;
  onTrackSelect: (track: SpotifyTrack) => void;
}

type ViewMode = 'recent' | 'top' | 'saved' | 'playlists' | 'search';

export const SpotifyBrowser = ({ selectedTrack, onTrackSelect }: SpotifyBrowserProps) => {
  const theme = useTheme();
  const { client, updateAuthenticationState } = useSpotify();

  // Services
  const [searchService, setSearchService] = useState<SpotifySearchService | null>(null);

  // View state
  const [currentView, setCurrentView] = useState<ViewMode>('recent');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Playlist state
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

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

  const pageSize = 10;

  // Initialize search service
  useEffect(() => {
    if (client) {
      setSearchService(new SpotifySearchService(client));
    }
  }, [client]);

  // Load playlists when playlists tab is selected
  const loadPlaylists = useCallback(async () => {
    if (!searchService) return;

    setPlaylistsLoading(true);
    setError(null);

    try {
      updateAuthenticationState(true);
      const results = await searchService.getUserPlaylists(50, 0);
      setPlaylists(results.playlists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load playlists';
      setError(errorMessage);
      console.error('Error loading playlists:', err);

      if (
        (err instanceof Error && err.message.includes('403')) ||
        (err instanceof Error && err.message.includes('401'))
      ) {
        updateAuthenticationState(false);
      }
    } finally {
      setPlaylistsLoading(false);
    }
  }, [searchService, updateAuthenticationState]);

  // Load tracks for the current view and page
  const loadTracks = useCallback(
    async (page: number = 1, view: ViewMode = currentView, playlistId?: string) => {
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

          case 'playlists': {
            if (playlistId) {
              // Load tracks from specific playlist
              const offset = (page - 1) * pageSize;
              const results = await searchService.getPlaylistTracks(playlistId, pageSize, offset);
              newTracks = results.tracks;
              newTotal = results.total;
            }
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
      setSelectedPlaylist(null); // Clear selected playlist when changing views

      if (currentView === 'playlists') {
        loadPlaylists();
        setTracks([]);
        setTotal(0);
      } else {
        loadTracks(1, currentView);
      }
    }
  }, [searchService, currentView, isSearchMode, loadPlaylists]);

  // Handle search results
  const handleSearchResults = useCallback((results: SearchResults) => {
    setSearchResults(results);
    setCurrentPage(1); // Always start from page 1 for new searches
  }, []);

  // Handle search state change
  const handleSearchStateChange = useCallback(
    (searching: boolean, query: string) => {
      setIsSearchMode(searching || !!query.trim());
      setSearchQuery(query);

      if (!searching && !query.trim()) {
        // Return to previous view when search is cleared
        setCurrentPage(1);
        setSelectedPlaylist(null);
        if (currentView === 'playlists') {
          loadPlaylists();
        } else {
          loadTracks(1, currentView);
        }
      }
    },
    [loadTracks, currentView, loadPlaylists]
  );

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: ViewMode) => {
    setCurrentView(newValue);
    setIsSearchMode(false);
    setSearchQuery('');
    setCurrentPage(1);
    setSelectedPlaylist(null);
  };

  // Handle playlist selection
  const handlePlaylistSelect = useCallback(
    (playlist: SpotifyPlaylist) => {
      setSelectedPlaylist(playlist);
      setCurrentPage(1);
      loadTracks(1, 'playlists', playlist.id);
    },
    [loadTracks]
  );

  // Handle back from playlist
  const handleBackFromPlaylist = useCallback(() => {
    setSelectedPlaylist(null);
    setTracks([]);
    setTotal(0);
    loadPlaylists();
  }, [loadPlaylists]);

  // Handle page change for browsing modes
  const handlePageChange = useCallback(
    (page: number) => {
      if (isSearchMode) {
        // Enable pagination for search results
        const offset = (page - 1) * pageSize;
        if (searchService && searchQuery.trim()) {
          setLoading(true);
          searchService
            .searchTracks(searchQuery, offset, pageSize)
            .then(results => {
              setSearchResults(results);
              setCurrentPage(page);
            })
            .catch(() => {
              setSearchResults({ tracks: [], total: 0, hasMore: false, offset: 0 });
            })
            .finally(() => {
              setLoading(false);
            });
        }
        return;
      }

      if (currentView === 'playlists' && selectedPlaylist) {
        loadTracks(page, 'playlists', selectedPlaylist.id);
      } else {
        loadTracks(page, currentView);
      }
    },
    [loadTracks, currentView, isSearchMode, selectedPlaylist, searchService, searchQuery, pageSize]
  );

  const getTabLabel = (tab: ViewMode) => {
    switch (tab) {
      case 'recent':
        return 'Recent';
      case 'top':
        return 'Top Tracks';
      case 'saved':
        return 'Liked Songs';
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
          ? `No tracks in "${selectedPlaylist.name}" playlist.`
          : 'No playlists found. Create some playlists on Spotify to see them here!';
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
  const showPagination = true; // Always show pagination when there are multiple pages

  // Render playlist list
  const renderPlaylists = () => (
    <List
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        p: 0,
      }}
    >
      {playlists.map((playlist, index) => (
        <Box key={playlist.id}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handlePlaylistSelect(playlist)}
              sx={{
                py: 1.5,
                px: 2,
                transition: 'all 0.15s ease-out',
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.08),
                },
              }}
            >
              <ListItemAvatar sx={{ minWidth: 56 }}>
                <Avatar
                  src={playlist.imageUrl || undefined}
                  variant="rounded"
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'grey.100',
                    borderRadius: 1.5,
                  }}
                >
                  <QueueMusic sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 0.25,
                    }}
                  >
                    {playlist.name}
                  </Typography>
                }
                secondary={
                  <Box>
                    {playlist.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.secondary',
                          display: 'block',
                          mb: 0.25,
                        }}
                      >
                        {playlist.description}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        opacity: 0.7,
                        fontSize: '0.7rem',
                      }}
                    >
                      {playlist.trackCount} tracks
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>

          {index < playlists.length - 1 && <Box sx={{ mx: 2, height: 1, bgcolor: 'divider' }} />}
        </Box>
      ))}
    </List>
  );

  return (
    <Fade in timeout={200}>
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
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 3,
              borderRadius: 0,
            }}
          >
            <Tabs
              value={currentView}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                minHeight: 40,
                '& .MuiTab-root': {
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 40,
                  py: 1,
                  transition: 'all 0.15s ease-out',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 700,
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 2,
                  borderRadius: 0,
                  bgcolor: 'primary.main',
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

        {/* Breadcrumb for playlist navigation */}
        {currentView === 'playlists' && selectedPlaylist && !isSearchMode && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleBackFromPlaylist}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>

            <Breadcrumbs separator="›" sx={{ fontSize: '0.875rem' }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleBackFromPlaylist}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                Playlists
              </Link>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                {selectedPlaylist.name}
              </Typography>
            </Breadcrumbs>
          </Box>
        )}

        {/* Current Context */}
        {(isSearchMode ||
          displayTracks.length > 0 ||
          (currentView === 'playlists' && !selectedPlaylist)) && (
          <Box
            sx={{
              mb: 2,
              px: 0.5,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {isSearchMode
                ? displayTotal > 0
                  ? `${displayTotal} results for "${searchQuery}" (showing ${displayTracks.length})`
                  : `No results for "${searchQuery}"`
                : currentView === 'playlists' && selectedPlaylist
                ? `${selectedPlaylist.trackCount} tracks in playlist`
                : getTabLabel(currentView)}
            </Typography>
          </Box>
        )}

        {/* Content */}
        {currentView === 'playlists' && !selectedPlaylist && !isSearchMode ? (
          // Show playlists list
          playlistsLoading ? (
            <StandardizedSongList
              tracks={[]}
              total={0}
              loading={true}
              error={null}
              selectedTrack={selectedTrack}
              onTrackSelect={onTrackSelect}
              onPageChange={() => {}}
              showPagination={false}
              sortable={false}
              emptyMessage=""
            />
          ) : error ? (
            <StandardizedSongList
              tracks={[]}
              total={0}
              loading={false}
              error={error}
              selectedTrack={selectedTrack}
              onTrackSelect={onTrackSelect}
              onPageChange={() => {}}
              showPagination={false}
              sortable={false}
              emptyMessage=""
            />
          ) : playlists.length > 0 ? (
            renderPlaylists()
          ) : (
            <StandardizedSongList
              tracks={[]}
              total={0}
              loading={false}
              error={null}
              selectedTrack={selectedTrack}
              onTrackSelect={onTrackSelect}
              onPageChange={() => {}}
              showPagination={false}
              sortable={false}
              emptyMessage={getEmptyMessage('playlists')}
            />
          )
        ) : (
          // Show tracks (either from playlist or other views)
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
            sortable={!isSearchMode}
            emptyMessage={getEmptyMessage(isSearchMode ? 'search' : currentView)}
          />
        )}
      </Box>
    </Fade>
  );
};
