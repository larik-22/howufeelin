import { useState, useMemo } from 'react';
import { Group } from '@/types/Group';
import { GroupMemberRole } from '@/types/GroupMemberRole';

// Filter types
export type FilterTab = 'all' | 'admin' | 'moderator' | 'member';
export type SortOption = 'name' | 'members' | 'recent';

interface UseGroupFiltersProps {
  groups: Group[];
  memberCounts: Record<string, number>;
}

interface UseGroupFiltersResult {
  searchQuery: string;
  activeFilterTab: FilterTab;
  sortOption: SortOption;
  showFilters: boolean;
  filteredGroups: Group[];
  setSearchQuery: (query: string) => void;
  setActiveFilterTab: (tab: FilterTab) => void;
  setSortOption: (option: SortOption) => void;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFilterTabChange: (event: React.SyntheticEvent, newValue: FilterTab) => void;
  handleSortChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
  toggleFilters: () => void;
}

export function useGroupFilters({
  groups,
  memberCounts,
}: UseGroupFiltersProps): UseGroupFiltersResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort groups
  const filteredGroups = useMemo(() => {
    let result = [...groups];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        group =>
          group.groupName.toLowerCase().includes(query) ||
          group.groupDescription.toLowerCase().includes(query) ||
          group.joinCode.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (activeFilterTab !== 'all') {
      result = result.filter(group => {
        switch (activeFilterTab) {
          case 'admin':
            return group.userRole === GroupMemberRole.ADMIN;
          case 'moderator':
            return group.userRole === GroupMemberRole.MODERATOR;
          case 'member':
            return group.userRole === GroupMemberRole.MEMBER;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.groupName.localeCompare(b.groupName);
        case 'members':
          return (memberCounts[b.groupId] || 0) - (memberCounts[a.groupId] || 0);
        case 'recent': {
          // Handle Timestamp type properly
          // Using a more specific approach for Firestore Timestamp
          const getTimestamp = (timestamp: unknown): number => {
            if (!timestamp) return 0;
            // Check if it's a Firestore Timestamp with toMillis method
            if (typeof timestamp === 'object' && timestamp !== null && 'toMillis' in timestamp) {
              return (timestamp as { toMillis: () => number }).toMillis();
            }
            // Fallback to timestamp value if it's a number
            return typeof timestamp === 'number' ? timestamp : 0;
          };

          return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [groups, searchQuery, activeFilterTab, sortOption, memberCounts]);

  // Filter handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterTabChange = (event: React.SyntheticEvent, newValue: FilterTab) => {
    console.log('handleFilterTabChange', event, newValue);
    setActiveFilterTab(newValue);
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortOption(event.target.value as SortOption);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilterTab('all');
  };

  return {
    searchQuery,
    activeFilterTab,
    sortOption,
    showFilters,
    filteredGroups,
    setSearchQuery,
    setActiveFilterTab,
    setSortOption,
    setShowFilters,
    clearFilters,
    handleSearchChange,
    handleFilterTabChange,
    handleSortChange,
    toggleFilters,
  };
}
