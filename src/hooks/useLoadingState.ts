import { useState, useEffect, useRef } from 'react';

interface UseLoadingStateOptions {
  /**
   * Minimum time in milliseconds to show loading state
   * This prevents flashing of loading states for quick operations
   */
  minLoadingTime?: number;
  /**
   * Whether to reset loading state when dependencies change
   */
  resetOnDependenciesChange?: boolean;
}

/**
 * Custom hook for managing loading states with a minimum display time
 * to prevent flashing of loading states for quick operations
 */
export function useLoadingState(
  isLoading: boolean,
  dependencies: unknown[] = [],
  options: UseLoadingStateOptions = {}
) {
  const { minLoadingTime = 500, resetOnDependenciesChange = true } = options;
  const [displayLoading, setDisplayLoading] = useState(isLoading);
  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isLoading) {
      // Start loading
      loadingStartTime.current = Date.now();
      setDisplayLoading(true);
    } else {
      // Calculate how long we've been loading
      const loadingDuration = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;

      // If we haven't been loading for the minimum time, set a timeout
      if (loadingDuration < minLoadingTime) {
        timeoutRef.current = setTimeout(() => {
          setDisplayLoading(false);
          loadingStartTime.current = null;
        }, minLoadingTime - loadingDuration);
      } else {
        // We've been loading long enough, stop immediately
        setDisplayLoading(false);
        loadingStartTime.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minLoadingTime]);

  // Reset loading state when dependencies change if configured
  useEffect(() => {
    if (resetOnDependenciesChange) {
      setDisplayLoading(isLoading);
      loadingStartTime.current = isLoading ? Date.now() : null;
    }
  }, dependencies);

  return displayLoading;
}
