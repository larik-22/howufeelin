import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import { Sort, CheckCircle } from '@mui/icons-material';
import { SpotifyTrack } from '@/services/spotify/search';

interface StandardizedSongListProps {
  tracks: SpotifyTrack[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedTrack: SpotifyTrack | null;
  onTrackSelect: (track: SpotifyTrack) => void;
  onPageChange: (page: number, pageSize: number) => void;
  currentPage?: number;
  pageSize?: number;
  showPagination?: boolean;
  sortable?: boolean;
  emptyMessage?: string;
}

type SortBy = 'name' | 'artist' | 'album' | 'popularity' | 'duration';
type SortOrder = 'asc' | 'desc';

export const StandardizedSongList = ({
  tracks,
  total,
  loading,
  error,
  selectedTrack,
  onTrackSelect,
  onPageChange,
  currentPage = 1,
  pageSize = 20,
  showPagination = true,
  sortable = true,
  emptyMessage = 'No songs found.',
}: StandardizedSongListProps) => {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Format duration helper
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Sort tracks
  const sortedTracks = [...tracks].sort((a, b) => {
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

  // Handle pagination
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page, pageSize);
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Loading songs...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        {error}
      </Alert>
    );
  }

  if (tracks.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 1 }}>
        {emptyMessage}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with count and sort */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {total > 0 ? `${total} songs` : `${tracks.length} songs`}
          </Typography>

          {showPagination && totalPages > 1 && (
            <Chip
              label={`Page ${currentPage} of ${totalPages}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>

        {/* Sort Controls */}
        {sortable && tracks.length > 1 && (
          <IconButton
            size="small"
            onClick={e => setSortMenuAnchor(e.currentTarget)}
            sx={{ color: 'text.secondary' }}
          >
            <Sort fontSize="small" />
          </IconButton>
        )}
      </Box>

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

      {/* Song List */}
      <List
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {sortedTracks.map((track, index) => (
          <Box key={track.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedTrack?.id === track.id}
                onClick={() => onTrackSelect(track)}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={track.albumImageUrl || undefined}
                      variant="rounded"
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'grey.200',
                        fontSize: '1.2rem',
                      }}
                    >
                      ♪
                    </Avatar>

                    {selectedTrack?.id === track.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          color: 'primary.main',
                          bgcolor: 'background.paper',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 20,
                          height: 20,
                        }}
                      >
                        <CheckCircle fontSize="small" />
                      </Box>
                    )}
                  </Box>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        color: selectedTrack?.id === track.id ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {track.name}
                    </Typography>
                  }
                  secondary={
                    <Box>
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
                        {track.artists.join(', ')}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.secondary',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          display: 'block',
                        }}
                      >
                        {track.album}
                      </Typography>
                    </Box>
                  }
                />

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    }}
                  >
                    {formatDuration(track.duration)}
                  </Typography>

                  {track.popularity && (
                    <Chip
                      label={`${track.popularity}%`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.6rem',
                        height: 18,
                        '& .MuiChip-label': { px: 0.5 },
                      }}
                    />
                  )}
                </Box>
              </ListItemButton>
            </ListItem>

            {index < sortedTracks.length - 1 && <Divider />}
          </Box>
        ))}
      </List>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};
