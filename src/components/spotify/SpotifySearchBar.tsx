import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Autocomplete,
  Paper,
  Typography,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Search, Clear, History, TrendingUp, MusicNote } from '@mui/icons-material';
import { SpotifySearchService, SearchResults } from '@/services/spotify/search';
import { useSpotify } from '@/contexts/spotify/SpotifyContext';

interface SpotifySearchBarProps {
  onSearchResults: (results: SearchResults) => void;
  onSearchStateChange: (isSearching: boolean, query: string) => void;
  placeholder?: string;
}

interface SearchSuggestion {
  type: 'suggestion' | 'history' | 'trending';
  text: string;
  icon: React.ReactNode;
}

const TRENDING_SEARCHES = [
  'Taylor Swift',
  'Billie Eilish',
  'The Weeknd',
  'Dua Lipa',
  'Harry Styles',
];

export const SpotifySearchBar = ({
  onSearchResults,
  onSearchStateChange,
  placeholder = 'Search for songs, artists, or albums...',
}: SpotifySearchBarProps) => {
  const theme = useTheme();
  const { client } = useSpotify();
  const [searchService, setSearchService] = useState<SpotifySearchService | null>(null);

  // Search state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize search service
  useEffect(() => {
    if (client) {
      setSearchService(new SpotifySearchService(client));
    }
  }, [client]);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('spotify-search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = useCallback(
    (newQuery: string) => {
      if (!newQuery.trim()) return;

      const updatedHistory = [newQuery, ...searchHistory.filter(item => item !== newQuery)].slice(
        0,
        5
      ); // Keep only last 5 searches

      setSearchHistory(updatedHistory);
      localStorage.setItem('spotify-search-history', JSON.stringify(updatedHistory));
    },
    [searchHistory]
  );

  // Get search suggestions
  const getSuggestions = useCallback(
    async (searchQuery: string) => {
      if (!searchService || !searchQuery.trim()) {
        // Show default suggestions when no query
        const defaultSuggestions: SearchSuggestion[] = [
          ...searchHistory.slice(0, 3).map(item => ({
            type: 'history' as const,
            text: item,
            icon: <History fontSize="small" />,
          })),
          ...TRENDING_SEARCHES.slice(0, 5 - searchHistory.length).map(item => ({
            type: 'trending' as const,
            text: item,
            icon: <TrendingUp fontSize="small" />,
          })),
        ];
        setSuggestions(defaultSuggestions);
        return;
      }

      try {
        const apiSuggestions = await searchService.getSearchSuggestions(searchQuery);
        const newSuggestions: SearchSuggestion[] = [
          ...apiSuggestions.map(text => ({
            type: 'suggestion' as const,
            text,
            icon: <MusicNote fontSize="small" />,
          })),
        ];

        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
      }
    },
    [searchService, searchHistory]
  );

  // Debounced suggestion fetching
  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    suggestionTimeoutRef.current = setTimeout(() => {
      getSuggestions(query);
    }, 300);

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [query, getSuggestions]);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchService || !searchQuery.trim()) {
        onSearchResults({
          tracks: [],
          total: 0,
          hasMore: false,
          offset: 0,
        });
        return;
      }

      setIsSearching(true);
      onSearchStateChange(true, searchQuery);

      try {
        const results = await searchService.searchTracks(searchQuery, 0, 20);
        onSearchResults(results);
        saveSearchHistory(searchQuery);
      } catch (error) {
        console.error('Search failed:', error);
        onSearchResults({
          tracks: [],
          total: 0,
          hasMore: false,
          offset: 0,
        });
      } finally {
        setIsSearching(false);
        onSearchStateChange(false, searchQuery);
      }
    },
    [searchService, onSearchResults, onSearchStateChange, saveSearchHistory]
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 500);
    } else {
      // Clear results when query is empty
      onSearchResults({
        tracks: [],
        total: 0,
        hasMore: false,
        offset: 0,
      });
      onSearchStateChange(false, '');
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch, onSearchResults, onSearchStateChange]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    performSearch(suggestion.text);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onSearchResults({
      tracks: [],
      total: 0,
      hasMore: false,
      offset: 0,
    });
    onSearchStateChange(false, '');
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('spotify-search-history');
    getSuggestions(query); // Refresh suggestions
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Autocomplete
        freeSolo
        open={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        inputValue={query}
        onInputChange={(_, value) => setQuery(value)}
        options={suggestions}
        getOptionLabel={option => (typeof option === 'string' ? option : option.text)}
        filterOptions={options => options} // Don't filter, we handle it ourselves
        renderInput={params => (
          <TextField
            {...params}
            fullWidth
            placeholder={placeholder}
            variant="outlined"
            value={query}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.paper',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
              },
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1.5, sm: 2 },
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  {isSearching ? <CircularProgress size={20} /> : <Search color="action" />}
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClear}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box
            component="li"
            {...props}
            onClick={() => handleSuggestionSelect(option)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Box sx={{ color: 'text.secondary' }}>{option.icon}</Box>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {option.text}
            </Typography>
            {option.type === 'trending' && (
              <Chip label="Trending" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            )}
            {option.type === 'history' && (
              <Typography variant="caption" color="text.secondary">
                Recent
              </Typography>
            )}
          </Box>
        )}
        PaperComponent={({ children, ...paperProps }) => (
          <Paper
            {...paperProps}
            sx={{
              mt: 1,
              borderRadius: 2,
              boxShadow: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {children}
            {searchHistory.length > 0 && (
              <>
                <Divider />
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Search History
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={clearSearchHistory}
                  >
                    Clear
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        )}
        noOptionsText={query ? 'No suggestions found' : 'Start typing to search...'}
      />
    </Box>
  );
};
