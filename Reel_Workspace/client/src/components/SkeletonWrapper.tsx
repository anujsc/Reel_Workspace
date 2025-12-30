import { useState, useEffect, ReactNode } from "react";

interface SkeletonWrapperProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  minDisplayTime?: number; // milliseconds
}

/**
 * Wrapper to prevent skeleton flickering by enforcing minimum display time
 * This ensures skeletons don't flash briefly when data loads quickly
 */
export function SkeletonWrapper({
  isLoading,
  skeleton,
  children,
  minDisplayTime = 300,
}: SkeletonWrapperProps) {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const [loadStartTime] = useState(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - loadStartTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowSkeleton(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShowSkeleton(false);
      }
    } else {
      setShowSkeleton(true);
    }
  }, [isLoading, loadStartTime, minDisplayTime]);

  return <>{showSkeleton ? skeleton : children}</>;
}
