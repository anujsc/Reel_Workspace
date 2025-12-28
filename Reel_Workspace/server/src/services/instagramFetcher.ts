import axios, { AxiosError } from "axios";
import {
  InvalidInstagramUrlError,
  MediaNotFoundError,
  PrivateMediaError,
  UnsupportedMediaError,
} from "../utils/errors.js";
import { fetchInstagramMediaWithYtDlp } from "./ytdlpFetcher.js";
import { fetchInstagramMediaWithPuppeteer } from "./puppeteerScraper.js";
import { fetchInstagramMediaWithInstaLoader } from "./instaLoaderScraper.js";

/**
 * Result from Instagram media fetch
 */
export interface InstagramMediaResult {
  sourceUrl: string;
  videoUrl: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

/**
 * Cobalt API response structure
 */
interface CobaltResponse {
  status: string;
  url?: string;
  picker?: Array<{ url: string; type: string }>;
  text?: string;
}

const INSTAGRAM_URL_REGEX =
  /^https?:\/\/(www\.)?instagram\.com\/(reel|p|stories)\/[\w-]+\/?/i;

const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1000, 2000];

/**
 * Clean Instagram URL by removing query parameters
 */
function cleanInstagramUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query parameters
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Validate Instagram URL format
 */
function validateInstagramUrl(url: string): void {
  if (!INSTAGRAM_URL_REGEX.test(url)) {
    throw new InvalidInstagramUrlError(
      "URL must be a valid Instagram reel, post, or story URL"
    );
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch Instagram media using multiple methods with fallback chain:
 * 1. Puppeteer (browser automation - best for deployment)
 * 2. InstaLoader (lightweight HTTP scraper - no browser needed)
 * 3. Cobalt API (external API - last resort)
 */
export async function fetchInstagramMedia(
  instagramUrl: string
): Promise<InstagramMediaResult> {
  // Validate URL format
  validateInstagramUrl(instagramUrl);

  // Clean URL (remove query parameters)
  const cleanUrl = cleanInstagramUrl(instagramUrl);
  console.log(`[Instagram Fetcher] Original URL: ${instagramUrl}`);
  console.log(`[Instagram Fetcher] Cleaned URL: ${cleanUrl}`);

  // Check scraping method priority
  // For deployment: Puppeteer (primary) -> Cobalt API (fallback)
  // yt-dlp requires system installation, not ideal for deployment
  const usePuppeteer = process.env.USE_PUPPETEER !== "false"; // Default: true
  const useYtDlp = process.env.USE_YTDLP === "true"; // Default: false
  const scrapingMethod = process.env.SCRAPING_METHOD || "puppeteer"; // Default: puppeteer

  // Method 1: Try Puppeteer first (best for deployment)
  if (
    usePuppeteer ||
    scrapingMethod === "puppeteer" ||
    scrapingMethod === "auto"
  ) {
    try {
      console.log(
        `[Instagram Fetcher] Attempting fetch with Puppeteer scraper (PRIMARY)...`
      );
      const result = await fetchInstagramMediaWithPuppeteer(cleanUrl);
      console.log(`[Instagram Fetcher] ✓ Successfully fetched with Puppeteer`);
      return result;
    } catch (error) {
      console.warn(
        `[Instagram Fetcher] Puppeteer failed, trying fallback methods...`
      );
      console.warn(
        `[Instagram Fetcher] Puppeteer error:`,
        error instanceof Error ? error.message : error
      );
      // Continue to next method
    }
  }

  // Method 2: Try yt-dlp (only if explicitly enabled)
  if (
    useYtDlp &&
    scrapingMethod !== "puppeteer" &&
    scrapingMethod !== "cobalt"
  ) {
    try {
      console.log(`[Instagram Fetcher] Attempting fetch with yt-dlp...`);
      const result = await fetchInstagramMediaWithYtDlp(cleanUrl);
      console.log(`[Instagram Fetcher] ✓ Successfully fetched with yt-dlp`);
      return result;
    } catch (error) {
      console.warn(
        `[Instagram Fetcher] yt-dlp failed, trying Cobalt fallback...`
      );
      console.warn(
        `[Instagram Fetcher] yt-dlp error:`,
        error instanceof Error ? error.message : error
      );
      // Continue to fallback methods
    }
  } else if (!useYtDlp) {
    console.log(
      `[Instagram Fetcher] yt-dlp disabled (not suitable for deployment)`
    );
  }

  // Method 3: Try lightweight InstaLoader (no browser required)
  try {
    console.log(
      `[Instagram Fetcher] Attempting fetch with InstaLoader (lightweight)...`
    );
    const result = await fetchInstagramMediaWithInstaLoader(cleanUrl);
    console.log(`[Instagram Fetcher] ✓ Successfully fetched with InstaLoader`);
    return result;
  } catch (error) {
    console.warn(
      `[Instagram Fetcher] InstaLoader failed, trying Cobalt API...`
    );
    console.warn(
      `[Instagram Fetcher] InstaLoader error:`,
      error instanceof Error ? error.message : error
    );
    // Continue to Cobalt fallback
  }

  // Method 4: Try Cobalt API (last resort)
  const cobaltApiUrl = process.env.COBALT_API_URL || "https://api.cobalt.tools";

  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[Instagram Fetcher] Attempt ${
          attempt + 1
        }/${MAX_RETRIES} for ${cleanUrl}`
      );

      const response = await axios.post<CobaltResponse>(
        cobaltApiUrl,
        {
          url: cleanUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          filenamePattern: "basic",
          isAudioOnly: false,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            // Note: Cobalt API may require authentication
            // If you have a Cobalt API key, add it here:
            // Authorization: `Bearer ${process.env.COBALT_API_KEY}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const data = response.data;

      console.log(`[Instagram Fetcher] Cobalt response status: ${data.status}`);

      // Check for successful response
      if (data.status === "error" || data.status === "rate-limit") {
        console.error(`[Instagram Fetcher] Cobalt error: ${data.text}`);
        throw new MediaNotFoundError(
          data.text || "Cobalt API returned an error"
        );
      }

      // Extract video URL
      let videoUrl: string | undefined;

      if (data.url) {
        videoUrl = data.url;
      } else if (data.picker && data.picker.length > 0) {
        // Find video in picker
        const videoItem = data.picker.find((item: any) =>
          item.type.includes("video")
        );
        videoUrl = videoItem?.url;
      }

      if (!videoUrl) {
        console.error(
          `[Instagram Fetcher] No video URL in response:`,
          JSON.stringify(data, null, 2)
        );
        throw new MediaNotFoundError("No video URL found in Cobalt response");
      }

      console.log(`[Instagram Fetcher] Successfully fetched media`);

      return {
        sourceUrl: instagramUrl,
        videoUrl,
        title: undefined,
        description: undefined,
        thumbnailUrl: undefined,
        durationSeconds: undefined,
      };
    } catch (error) {
      lastError = error as Error;

      // Check for specific error types that shouldn't be retried
      if (error instanceof InvalidInstagramUrlError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Log detailed error information
        console.error(
          `[Instagram Fetcher] Axios error:`,
          axiosError.response?.status,
          axiosError.response?.data
        );

        // Private account or forbidden
        if (axiosError.response?.status === 403) {
          throw new PrivateMediaError(
            "Cannot access private or restricted media"
          );
        }

        // Not found
        if (axiosError.response?.status === 404) {
          throw new MediaNotFoundError("Media not found or has been deleted");
        }

        // Bad request - check if it's a Cobalt API issue
        if (axiosError.response?.status === 400) {
          const responseData = axiosError.response.data as any;
          console.error(`[Instagram Fetcher] 400 error details:`, responseData);

          // Check for JWT authentication error
          if (responseData?.error?.code === "error.api.auth.jwt.missing") {
            throw new MediaNotFoundError(
              "Cobalt API requires authentication. Please self-host Cobalt or use an alternative (see COBALT_AUTH_SOLUTION.md)"
            );
          }

          if (
            responseData?.text?.includes("unsupported") ||
            responseData?.text?.includes("not supported")
          ) {
            throw new UnsupportedMediaError("This media type is not supported");
          }

          // If it's a Cobalt API error, include the message
          if (responseData?.text) {
            throw new MediaNotFoundError(
              `Cobalt API error: ${responseData.text}`
            );
          }
        }
      }

      // If not the last attempt, wait and retry
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        console.log(
          `[Instagram Fetcher] Retrying in ${delay}ms after error:`,
          error instanceof Error ? error.message : error
        );
        await sleep(delay);
      }
    }
  }

  // All retries failed
  throw new MediaNotFoundError(
    `Failed to fetch Instagram media after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
