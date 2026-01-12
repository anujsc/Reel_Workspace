import { useEffect, useRef } from "react";

/**
 * Custom hook for auto-scrolling chat messages to bottom
 */
export function useChatScroll<T>(dependency: T) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [dependency]);

  return scrollRef;
}
