import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Autocomplete,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
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
}

const TRENDING_SEARCHES = [
  'Taylor Swift',
  'Billie Eilish',
  'The Weeknd',
  'Dua Lipa',
  'Harry Styles',
  'Drake',
  'Ariana Grande',
  'Post Malone',
];

const SEARCH_DEBOUNCE_MS = 400;
const SUGGESTION_DEBOUNCE_MS = 200;
const MAX_HISTORY_ITEMS = 5;

export const SpotifySearchBar = ({
  onSearchResults,
  onSearchStateChange,
  placeholder = 'Search for songs, artists, or albums...',
}: SpotifySearchBarProps) => {
  const theme = useTheme();
  const { client } = useSpotify();

  // Core state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Services
  const [searchService, setSearchService] = useState<SpotifySearchService | null>(null);

  // Refs for cleanup
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize search service
  useEffect(() => {
    if (client) {
      setSearchService(new SpotifySearchService(client));
    }
  }, [client]);

  // Load search history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('spotify-search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Memoized trending suggestions
  const trendingSuggestions = useMemo(
    () =>
      TRENDING_SEARCHES.slice(0, 6).map(text => ({
        type: 'trending' as const,
        text,
      })),
    []
  );

  // Generate default suggestions when not searching
  const defaultSuggestions = useMemo(() => {
    const historySuggestions = searchHistory.slice(0, 3).map(text => ({
      type: 'history' as const,
      text,
    }));

    const remainingSlots = 6 - historySuggestions.length;
    const trending = trendingSuggestions.slice(0, remainingSlots);

    return [...historySuggestions, ...trending];
  }, [searchHistory, trendingSuggestions]);

  // Save search to history
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setSearchHistory(prev => {
      const updatedHistory = [searchQuery, ...prev.filter(item => item !== searchQuery)].slice(
        0,
        MAX_HISTORY_ITEMS
      );

      localStorage.setItem('spotify-search-history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  // Get search suggestions from API
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (!searchService || !searchQuery.trim()) {
        setSuggestions(defaultSuggestions);
        return;
      }

      try {
        const apiSuggestions = await searchService.getSearchSuggestions(searchQuery);
        const formattedSuggestions = apiSuggestions.slice(0, 6).map(text => ({
          type: 'suggestion' as const,
          text,
        }));
        setSuggestions(formattedSuggestions);
      } catch {
        setSuggestions(defaultSuggestions);
      }
    },
    [searchService, defaultSuggestions]
  );

  // Perform search - SINGLE SOURCE OF TRUTH
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchService) return;

      // Clear previous timeout to prevent overlapping
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      if (!searchQuery.trim()) {
        setIsSearching(false);
        onSearchResults({ tracks: [], total: 0, hasMore: false, offset: 0 });
        onSearchStateChange(false, '');
        return;
      }

      setIsSearching(true);
      onSearchStateChange(true, searchQuery);

      try {
        const results = await searchService.searchTracks(searchQuery, 0, 10);
        onSearchResults(results);
        saveToHistory(searchQuery);
      } catch {
        onSearchResults({ tracks: [], total: 0, hasMore: false, offset: 0 });
      } finally {
        setIsSearching(false);
        onSearchStateChange(false, searchQuery);
      }
    },
    [searchService, onSearchResults, onSearchStateChange, saveToHistory]
  );

  // Handle input change - ONLY for UI and suggestions
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);

      // Clear suggestion timeout
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }

      // Handle suggestions only
      if (value.trim()) {
        suggestionTimeoutRef.current = setTimeout(() => {
          fetchSuggestions(value);
        }, SUGGESTION_DEBOUNCE_MS);
      } else {
        setSuggestions(defaultSuggestions);
      }
    },
    [fetchSuggestions, defaultSuggestions]
  );

  // Single search effect - ONLY trigger for search
  useEffect(() => {
    // Clear any existing search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if there's a query
    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, SEARCH_DEBOUNCE_MS);
    } else {
      // Immediately clear when empty
      performSearch('');
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    };
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setQuery(suggestion.text);
      performSearch(suggestion.text);
    },
    [performSearch]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    // Clear all timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = null;
    }

    // Reset all states
    setQuery('');
    setIsSearching(false);
    setSuggestions(defaultSuggestions);
    onSearchResults({ tracks: [], total: 0, hasMore: false, offset: 0 });
    onSearchStateChange(false, '');
  }, [onSearchResults, onSearchStateChange, defaultSuggestions]);

  // Render suggestion option
  const renderSuggestion = useCallback(
    (suggestion: SearchSuggestion, index: number) => (
      <Box
        key={`${suggestion.type}-${suggestion.text}-${index}`}
        onClick={() => handleSuggestionSelect(suggestion)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 1.25,
          px: 2,
          cursor: 'pointer',
          transition: 'all 0.15s ease-out',
          borderRadius: 1,
          mx: 0.5,
          '&:hover': {
            bgcolor: alpha(theme.palette.action.hover, 0.08),
          },
        }}
      >
        <Box sx={{ color: 'text.secondary', flexShrink: 0 }}>
          {suggestion.type === 'history' && <History fontSize="small" />}
          {suggestion.type === 'trending' && <TrendingUp fontSize="small" />}
          {suggestion.type === 'suggestion' && <MusicNote fontSize="small" />}
        </Box>

        <Typography
          variant="body2"
          sx={{
            flex: 1,
            fontWeight: suggestion.type === 'suggestion' ? 500 : 400,
            color: 'text.primary',
          }}
        >
          {suggestion.text}
        </Typography>

        {suggestion.type === 'trending' && (
          <Typography
            variant="caption"
            sx={{
              color: 'warning.main',
              fontSize: '0.7rem',
              fontWeight: 500,
            }}
          >
            Trending
          </Typography>
        )}
      </Box>
    ),
    [handleSuggestionSelect, theme.palette.action.hover]
  );

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Autocomplete
        freeSolo
        open={isFocused && suggestions.length > 0}
        inputValue={query}
        onInputChange={(_, value) => handleInputChange(value)}
        options={suggestions}
        getOptionLabel={option => (typeof option === 'string' ? option : option.text)}
        filterOptions={options => options} // No filtering, we handle it
        renderInput={params => (
          <TextField
            {...params}
            fullWidth
            placeholder={placeholder}
            variant="outlined"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay to allow click
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.paper',
                transition: 'all 0.15s ease-out',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused': {
                  borderColor: 'primary.main',
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                fontSize: '0.9rem',
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  {isSearching ? (
                    <CircularProgress size={18} sx={{ color: 'primary.main' }} />
                  ) : (
                    <Search sx={{ color: isFocused ? 'primary.main' : 'text.secondary' }} />
                  )}
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
        renderOption={() => null} // We handle custom rendering
        PaperComponent={({ ...props }) => (
          <Paper
            {...props}
            sx={{
              mt: 0.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              overflow: 'hidden',
              boxShadow: theme.shadows[4],
            }}
          >
            <Box sx={{ py: 1 }}>
              {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
            </Box>
          </Paper>
        )}
        noOptionsText={null} // Hide default no options text
      />
    </Box>
  );
};
