/**
 * Responsive utility functions and constants
 * Mobile-first approach with Tailwind breakpoints
 */

export const BREAKPOINTS = {
  mobile: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (typeof window === "undefined") return "mobile";

  const width = window.innerWidth;

  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "mobile";
}

/**
 * Check if current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < BREAKPOINTS.md
  );
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get safe area insets for notched devices
 */
export function getSafeAreaInsets() {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue("--sat") || "0"),
    right: parseInt(style.getPropertyValue("--sar") || "0"),
    bottom: parseInt(style.getPropertyValue("--sab") || "0"),
    left: parseInt(style.getPropertyValue("--sal") || "0"),
  };
}

/**
 * Responsive image srcset generator
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [360, 640, 1024, 1280]
): string {
  return widths.map((width) => `${baseUrl}?w=${width} ${width}w`).join(", ");
}

/**
 * Get optimal image size based on viewport
 */
export function getOptimalImageSize(): number {
  if (typeof window === "undefined") return 640;

  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  if (width < BREAKPOINTS.sm) return Math.min(360 * dpr, 640);
  if (width < BREAKPOINTS.md) return Math.min(640 * dpr, 1024);
  if (width < BREAKPOINTS.lg) return Math.min(1024 * dpr, 1280);
  return Math.min(1280 * dpr, 1920);
}

/**
 * Debounce function for resize handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
