import { useRef, useCallback, useState, TouchEvent } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Pull distance to trigger refresh (default: 80px)
  resistance?: number; // Pull resistance factor (default: 2.5)
}

/**
 * Custom hook for pull-to-refresh functionality on mobile
 * Returns pull distance and handlers for touch events
 */
export function usePullToRefresh(options: PullToRefreshOptions) {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStart = useRef<number | null>(null);
  const scrollTop = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start pull if at top of scroll
    const element = e.currentTarget as HTMLElement;
    scrollTop.current = element.scrollTop;

    if (scrollTop.current === 0) {
      touchStart.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        touchStart.current === null ||
        scrollTop.current > 0 ||
        isRefreshing
      ) {
        return;
      }

      const currentTouch = e.touches[0].clientY;
      const diff = currentTouch - touchStart.current;

      // Only allow pulling down
      if (diff > 0) {
        // Apply resistance to make pulling feel natural
        const distance = Math.min(diff / resistance, threshold * 1.5);
        setPullDistance(distance);

        // Prevent default scroll behavior when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [threshold, resistance, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (touchStart.current === null || isRefreshing) {
      return;
    }

    // Trigger refresh if pulled beyond threshold
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Lock at threshold during refresh

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Snap back if not pulled enough
      setPullDistance(0);
    }

    touchStart.current = null;
  }, [pullDistance, threshold, onRefresh, isRefreshing]);

  return {
    pullDistance,
    isRefreshing,
    isPulling: pullDistance > 0,
    isTriggered: pullDistance >= threshold,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
