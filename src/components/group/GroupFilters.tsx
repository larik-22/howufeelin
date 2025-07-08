import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { FilterTab, SortOption } from '@/hooks/useGroupFilters';

interface GroupFiltersProps {
  searchQuery: string;
  activeFilterTab: FilterTab;
  sortOption: SortOption;
  showFilters: boolean;
  groupsCount: number;
  filteredGroupsCount: number;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterTabChange: (event: React.SyntheticEvent, newValue: FilterTab) => void;
  onSortChange: (event: SelectChangeEvent<SortOption>) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

export default function GroupFilters({
  searchQuery,
  activeFilterTab,
  sortOption,
  showFilters,
  groupsCount,
  filteredGroupsCount,
  onSearchChange,
  onFilterTabChange,
  onSortChange,
  onToggleFilters,
  onClearFilters,
}: GroupFiltersProps) {
  const hasActiveFilters = searchQuery || activeFilterTab !== 'all';

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
          <TextField
            fullWidth
            placeholder="Search groups by name, description, or join code"
            value={searchQuery}
            onChange={onSearchChange}
            variant="outlined"
            size="small"
            sx={{ mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title={showFilters ? 'Hide filters' : 'Show filters'}>
            <IconButton onClick={onToggleFilters} color={showFilters ? 'primary' : 'default'}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filter Options */}
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}
            >
              <FormControl fullWidth size="small">
                <InputLabel id="sort-label">Sort by</InputLabel>
                <Select
                  labelId="sort-label"
                  value={sortOption}
                  onChange={onSortChange}
                  label="Sort by"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="members">Members</MenuItem>
                  <MenuItem value="recent">Most Recent</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Tabs
              value={activeFilterTab}
              onChange={onFilterTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="group filter tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="All Groups" value="all" />
              <Tab label="Admin" value="admin" icon={<ManageAccountsIcon />} iconPosition="start" />
              <Tab label="Moderator" value="moderator" icon={<PeopleIcon />} iconPosition="start" />
              <Tab label="Member" value="member" icon={<GroupIcon />} iconPosition="start" />
            </Tabs>
          </Box>
        )}
      </Paper>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredGroupsCount} of {groupsCount} groups
          </Typography>
          <Button size="small" onClick={onClearFilters} sx={{ ml: 1 }}>
            Clear filters
          </Button>
        </Box>
      )}
    </>
  );
}
