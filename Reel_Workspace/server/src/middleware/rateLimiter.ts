import rateLimit from "express-rate-limit";

/**
 * Rate limiter for reel extraction endpoint
 * Prevents multiple concurrent processing requests that spike memory
 */
export const reelExtractionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // Only 1 request per minute per IP (CRITICAL for 512MB RAM)
  message: {
    success: false,
    message: "Please wait before processing another reel. Limit: 1 per minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting
  skipSuccessfulRequests: false,
  // Skip failed requests from counting
  skipFailedRequests: true,
});

/**
 * Global rate limiter for all API endpoints
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
