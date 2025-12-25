import { useRef, useCallback, TouchEvent } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe (default: 50px)
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

/**
 * Custom hook for handling swipe gestures on mobile
 * Supports left, right, up, and down swipes
 */
export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      // Calculate velocity (px/ms)
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine if it's a horizontal or vertical swipe
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      // Check if swipe meets threshold and velocity requirements
      if (isHorizontal && Math.abs(deltaX) > threshold && velocityX > 0.3) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (
        !isHorizontal &&
        Math.abs(deltaY) > threshold &&
        velocityY > 0.3
      ) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }

      touchStart.current = null;
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
