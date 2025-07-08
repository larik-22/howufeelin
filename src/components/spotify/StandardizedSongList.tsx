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
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Skeleton,
  Fade,
  alpha,
} from '@mui/material';
import { Sort, CheckCircle, MusicNote } from '@mui/icons-material';
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

const LoadingSkeleton = () => (
  <Box sx={{ p: 2 }}>
    {[1, 2, 3, 4, 5].map(index => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="60%" height={14} />
        </Box>
        <Skeleton variant="text" width={40} height={14} />
      </Box>
    ))}
  </Box>
);

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
      <Fade in timeout={200}>
        <Box>
          <LoadingSkeleton />
        </Box>
      </Fade>
    );
  }

  if (error) {
    return (
      <Fade in timeout={200}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            border: 'none',
            bgcolor: alpha(theme.palette.error.main, 0.08),
            color: 'error.main',
            '& .MuiAlert-icon': {
              color: 'error.main',
            },
          }}
        >
          {error}
        </Alert>
      </Fade>
    );
  }

  if (tracks.length === 0) {
    return (
      <Fade in timeout={200}>
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            border: 'none',
            bgcolor: alpha(theme.palette.info.main, 0.06),
            color: 'text.secondary',
          }}
        >
          {emptyMessage}
        </Alert>
      </Fade>
    );
  }

  return (
    <Fade in timeout={200}>
      <Box>
        {/* Header with count and sort */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {total > 0 ? `${total} songs` : `${tracks.length} songs`}
            </Typography>

            {showPagination && totalPages > 1 && (
              <Chip
                label={`${currentPage} of ${totalPages}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  borderRadius: 1,
                  borderColor: 'divider',
                  color: 'text.secondary',
                }}
              />
            )}
          </Box>

          {/* Sort Controls */}
          {sortable && tracks.length > 1 && (
            <IconButton
              size="small"
              onClick={e => setSortMenuAnchor(e.currentTarget)}
              sx={{
                color: 'text.secondary',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.2),
                  color: 'text.primary',
                },
              }}
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
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: 2,
              border: 'none',
              boxShadow: theme.shadows[8],
              mt: 0.5,
            },
          }}
        >
          {(['name', 'artist', 'album', 'popularity', 'duration'] as SortBy[]).map(option => (
            <MenuItem
              key={option}
              onClick={() => handleSort(option)}
              sx={{
                px: 2,
                py: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.2),
                },
              }}
            >
              <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                {option}{' '}
                {sortBy === option && (
                  <Box component="span" sx={{ color: 'primary.main', ml: 1 }}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Box>
                )}
              </Typography>
            </MenuItem>
          ))}
        </Menu>

        {/* Song List */}
        <List
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            p: 0,
          }}
        >
          {sortedTracks.map((track, index) => {
            const isSelected = selectedTrack?.id === track.id;

            return (
              <Box key={track.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => onTrackSelect(track)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      position: 'relative',
                      borderRadius: 0,
                      transition: 'all 0.15s ease-out',
                      bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.3)
                          : alpha(theme.palette.action.hover, 0.09),
                      },
                      // Selection indicator - left border
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        bgcolor: isSelected ? 'primary.main' : 'transparent',
                        transition: 'all 0.15s ease-out',
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 56 }}>
                      <Avatar
                        src={track.albumImageUrl || undefined}
                        variant="rounded"
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'grey.100',
                          borderRadius: 1.5,
                        }}
                      >
                        <MusicNote sx={{ fontSize: '1rem', color: 'text.secondary' }} />
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
                            color: isSelected ? 'primary.main' : 'text.primary',
                            mb: 0.25,
                          }}
                        >
                          {track.name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
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
                            {track.artists.join(', ')}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'text.secondary',
                              opacity: 0.7,
                              fontSize: '0.7rem',
                              display: 'block',
                            }}
                          >
                            {track.album}
                          </Typography>
                        </>
                      }
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 0.5,
                        minWidth: 80,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                        }}
                      >
                        {formatDuration(track.duration)}
                      </Typography>
                    </Box>

                    {/* Clean checkmark indicator */}
                    {isSelected && (
                      <Box
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: '25%',
                          transform: 'translateY(-50%)',
                          color: 'primary.main',
                        }}
                      >
                        <CheckCircle sx={{ fontSize: '1.2rem' }} />
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>

                {index < sortedTracks.length - 1 && <Divider sx={{ ml: 7, mr: 2 }} />}
              </Box>
            );
          })}
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
                  fontWeight: 500,
                  borderRadius: 1.5,
                  transition: 'all 0.15s ease-out',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.2),
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                  },
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Fade>
  );
};
