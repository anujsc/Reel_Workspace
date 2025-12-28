import axios from "axios";
import { MediaNotFoundError, PrivateMediaError } from "../utils/errors.js";
import { InstagramMediaResult } from "./instagramFetcher.js";

/**
 * Lightweight Instagram scraper using public Instagram API endpoints
 * This is a fallback method that doesn't require browser automation
 */

/**
 * Extract shortcode from Instagram URL
 */
function extractShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch Instagram media using public API endpoints
 * This method uses Instagram's public GraphQL API
 */
export async function fetchInstagramMediaWithInstaLoader(
  url: string
): Promise<InstagramMediaResult> {
  console.log(`[InstaLoader] Starting fetch for: ${url}`);

  const shortcode = extractShortcode(url);
  if (!shortcode) {
    throw new MediaNotFoundError("Could not extract shortcode from URL");
  }

  console.log(`[InstaLoader] Extracted shortcode: ${shortcode}`);

  try {
    // Method 1: Try Instagram's public embed API
    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;

    console.log(`[InstaLoader] Fetching embed page...`);
    const response = await axios.get(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 15000,
    });

    const html = response.data;

    // Extract video URL from embed page
    const videoUrlMatch = html.match(/"video_url":"([^"]+)"/);
    if (videoUrlMatch) {
      const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, "&");
      console.log(`[InstaLoader] ✓ Found video URL via embed API`);

      // Try to extract additional metadata
      const titleMatch = html.match(/"caption":"([^"]+)"/);
      const thumbnailMatch = html.match(/"display_url":"([^"]+)"/);

      return {
        sourceUrl: url,
        videoUrl,
        title: titleMatch ? titleMatch[1].substring(0, 100) : undefined,
        thumbnailUrl: thumbnailMatch
          ? thumbnailMatch[1].replace(/\\u0026/g, "&")
          : undefined,
      };
    }

    // Method 2: Try to find video in script tags
    const scriptMatch = html.match(
      /"contentUrl":"(https:\/\/[^"]+\.mp4[^"]*)"/
    );
    if (scriptMatch) {
      const videoUrl = scriptMatch[1].replace(/\\u0026/g, "&");
      console.log(`[InstaLoader] ✓ Found video URL via script tag`);

      return {
        sourceUrl: url,
        videoUrl,
      };
    }

    // Method 3: Try alternative video URL pattern
    const altVideoMatch = html.match(/"src":"(https:\/\/[^"]+\.mp4[^"]*)"/);
    if (altVideoMatch) {
      const videoUrl = altVideoMatch[1].replace(/\\u0026/g, "&");
      console.log(`[InstaLoader] ✓ Found video URL via alternative pattern`);

      return {
        sourceUrl: url,
        videoUrl,
      };
    }

    throw new MediaNotFoundError("Could not find video URL in embed page");
  } catch (error) {
    if (error instanceof MediaNotFoundError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new MediaNotFoundError("Media not found or has been deleted");
      }
      if (error.response?.status === 403) {
        throw new PrivateMediaError(
          "Cannot access private or restricted media"
        );
      }
    }

    console.error(`[InstaLoader] Error:`, error);
    throw new MediaNotFoundError(
      `Failed to fetch Instagram media: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Alternative method using oEmbed API
 */
export async function fetchInstagramMediaWithOEmbed(
  url: string
): Promise<InstagramMediaResult> {
  console.log(`[InstaLoader] Trying oEmbed API for: ${url}`);

  try {
    const oembedUrl = `https://www.instagram.com/oembed/?url=${encodeURIComponent(
      url
    )}`;

    const response = await axios.get(oembedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const data = response.data;

    // oEmbed doesn't provide direct video URL, but we can get metadata
    // and then fetch the actual page
    if (data.thumbnail_url) {
      console.log(`[InstaLoader] Got metadata from oEmbed, fetching video...`);
      return await fetchInstagramMediaWithInstaLoader(url);
    }

    throw new MediaNotFoundError("oEmbed did not return video information");
  } catch (error) {
    console.error(`[InstaLoader] oEmbed failed:`, error);
    throw new MediaNotFoundError(
      `oEmbed fetch failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
