import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic Infinite Scroll Hook
 *
 * A reusable hook that implements infinite scrolling functionality with
 * IntersectionObserver API for better performance.
 *
 * Features:
 * - Automatic loading when user scrolls near bottom
 * - Support for search/filter parameters
 * - Loading state management
 * - Error handling
 * - Prevents duplicate requests
 *
 * @template T - Type of items being loaded
 * @param fetchFunction - Function to fetch data (should accept page number and return items)
 * @param initialPage - Starting page number (default: 1)
 * @param pageSize - Number of items per page (default: 20)
 * @returns Hook state and controls
 */
export function useInfiniteScroll<T>(
  fetchFunction: (page: number, pageSize: number, filters?: any) => Promise<T[]>,
  initialPage: number = 1,
  pageSize: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>(null);

  // Reference to track if a fetch is in progress
  const fetchingRef = useRef(false);

  // Observer reference
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  /**
   * Fetch items for the current page
   */
  const fetchItems = useCallback(async (pageNum: number, resetItems: boolean = false) => {
    // Prevent duplicate requests
    if (fetchingRef.current || (!hasMore && !resetItems)) return;

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      const newItems = await fetchFunction(pageNum, pageSize, filters);

      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      setItems((prevItems) => {
        if (resetItems) {
          return newItems;
        }
        // Prevent duplicate items by checking if they already exist
        const existingIds = new Set(
          prevItems.map((item: any) => item.id || item._id || item.sku)
        );
        const uniqueNewItems = newItems.filter(
          (item: any) => !existingIds.has(item.id || item._id || item.sku)
        );
        return [...prevItems, ...uniqueNewItems];
      });

      if (newItems.length === 0) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setError(err.message || 'Failed to load items');
      setHasMore(false);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetchFunction, pageSize, hasMore, filters]);

  /**
   * Load next page
   */
  const loadMore = useCallback(() => {
    if (!fetchingRef.current && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(nextPage, false);
    }
  }, [page, hasMore, loading, fetchItems]);

  /**
   * Reset and reload from the beginning
   * Useful when filters change
   */
  const reset = useCallback((newFilters?: any) => {
    setPage(initialPage);
    setItems([]);
    setHasMore(true);
    setError(null);
    fetchingRef.current = false;

    if (newFilters !== undefined) {
      setFilters(newFilters);
    }

    // Fetch will be triggered by useEffect when page changes
  }, [initialPage]);

  /**
   * Update filters and reset
   */
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setPage(initialPage);
    setItems([]);
    setHasMore(true);
    setError(null);
    fetchingRef.current = false;
  }, [initialPage]);

  /**
   * Intersection Observer callback
   */
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading && !fetchingRef.current) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

  /**
   * Set up intersection observer
   */
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '200px', // Load more when 200px from bottom
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  /**
   * Observe the last element
   */
  const setLastElementRef = useCallback((element: HTMLDivElement | null) => {
    if (observerRef.current && lastElementRef.current) {
      observerRef.current.unobserve(lastElementRef.current);
    }

    if (element && observerRef.current) {
      observerRef.current.observe(element);
      lastElementRef.current = element;
    }
  }, []);

  /**
   * Initial fetch
   */
  useEffect(() => {
    if (page === initialPage && items.length === 0 && !fetchingRef.current) {
      fetchItems(initialPage, true);
    }
  }, [page, initialPage, items.length, fetchItems]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    updateFilters,
    setLastElementRef,
    // For manual control if needed
    refetch: () => fetchItems(page, true),
  };
}
