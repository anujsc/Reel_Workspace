import {
  InvalidInstagramUrlError,
  MediaNotFoundError,
} from "../utils/errors.js";
import { INSTAGRAM_URL_REGEX } from "../utils/validators.js";
import {
  extractWithInstaloader,
  extractWithYtDlp,
  ExtractionStrategyError,
} from "./instagramCliExtractors.js";
import {
  extractWithSocialKit,
  SocialKitExtractionError,
} from "./socialKitExtractor.js";
import { SocialKitConfigurationError } from "../utils/errors.js";

/**
 * Result from Instagram media fetch
 */
export interface InstagramMediaResult {
  sourceUrl: string;
  videoUrl: string;
  source?: "socialkit" | "yt-dlp" | "instaloader";
  localFilePath?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

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
      "URL must be a valid Instagram reel, post, reels, or tv URL",
    );
  }
}

function envEnabled(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return defaultValue;
}

function sanitizeForLog(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 300);
}

function logStrategyFailure(strategy: string, error: unknown): void {
  if (error instanceof SocialKitExtractionError) {
    console.warn(
      `[Instagram Extractor] ${strategy} failed: ${error.code} - ${error.message}`,
    );
    return;
  }

  if (error instanceof ExtractionStrategyError) {
    const details = error.details;
    console.warn(
      `[Instagram Extractor] ${strategy} failed: ${error.message}; exit=${
        details?.exitCode ?? "n/a"
      }; signal=${details?.signal ?? "n/a"}; timedOut=${
        details?.timedOut ?? false
      }; durationMs=${details?.durationMs ?? 0}; stderr=${
        details?.stderr || "none"
      }`,
    );
    return;
  }

  console.warn(
    `[Instagram Extractor] ${strategy} failed: ${sanitizeForLog(
      error instanceof Error ? error.message : String(error),
    )}`,
  );
}

function getStrategyFailureReason(error: unknown): string {
  if (error instanceof SocialKitExtractionError) {
    return `${error.code}: ${error.message}`;
  }

  const rawMessage =
    error instanceof ExtractionStrategyError
      ? error.details?.stderr || error.message
      : error instanceof Error
        ? error.message
        : String(error);

  if (
    /10054|ECONNRESET|ConnectionResetError|connection was forcibly closed|connection reset/i.test(
      rawMessage,
    )
  ) {
    return "Instagram connection was reset by the network (ECONNRESET); configure EXTRACTOR_PROXY for this network";
  }

  if (/getaddrinfo failed|NameResolutionError|Could not resolve host/i.test(rawMessage)) {
    return "Instagram hostname could not be resolved; check DNS or EXTRACTOR_DOH_URL";
  }

  return sanitizeForLog(rawMessage);
}

/**
 * Fetch Instagram media with the configured fallback chain:
 * 1. SocialKit
 * 2. yt-dlp
 * 3. Instaloader
 */
export async function fetchInstagramMedia(
  instagramUrl: string,
): Promise<InstagramMediaResult> {
  // Validate URL format
  validateInstagramUrl(instagramUrl);

  // Clean URL (remove query parameters)
  const cleanUrl = cleanInstagramUrl(instagramUrl);
  console.log(`[Instagram Extractor] Starting extraction`);
  console.log(`[Instagram Extractor] Original URL: ${instagramUrl}`);
  console.log(`[Instagram Extractor] Cleaned URL: ${cleanUrl}`);

  const useYtDlp = envEnabled("USE_YTDLP", true);
  const useInstaloader = envEnabled("USE_INSTALOADER", true);
  const useSocialKit = envEnabled("USE_SOCIALKIT", true);
  const failureReasons: string[] = [];

  if (useSocialKit) {
    const startedAt = Date.now();
    console.log(`[Instagram Extractor] Strategy: SocialKit`);
    try {
      const result = await extractWithSocialKit(cleanUrl);
      console.log(
        `[Instagram Extractor] Strategy success: SocialKit (${Date.now() - startedAt}ms)`,
      );
      return result;
    } catch (error) {
      if (error instanceof SocialKitConfigurationError) {
        throw error;
      }

      logStrategyFailure("SocialKit", error);
      failureReasons.push(`SocialKit: ${getStrategyFailureReason(error)}`);
      console.warn(`[Instagram Extractor] SocialKit failed, trying yt-dlp`);
    }
  } else {
    console.log(`[Instagram Extractor] Strategy skipped: SocialKit disabled`);
  }

  if (useYtDlp) {
    const startedAt = Date.now();
    console.log(`[Instagram Extractor] Strategy: yt-dlp`);
    try {
      const result = await extractWithYtDlp(cleanUrl);
      console.log(
        `[Instagram Extractor] Strategy success: yt-dlp (${Date.now() - startedAt}ms)`,
      );
      return result;
    } catch (error) {
      logStrategyFailure("yt-dlp", error);
      failureReasons.push(`yt-dlp: ${getStrategyFailureReason(error)}`);
    }
  } else {
    console.log(`[Instagram Extractor] Strategy skipped: yt-dlp disabled`);
  }

  if (useInstaloader) {
    const startedAt = Date.now();
    console.log(`[Instagram Extractor] Strategy: Instaloader`);
    try {
      const result = await extractWithInstaloader(cleanUrl);
      console.log(
        `[Instagram Extractor] Strategy success: Instaloader (${Date.now() - startedAt}ms)`,
      );
      return result;
    } catch (error) {
      logStrategyFailure("instaloader", error);
      failureReasons.push(`Instaloader: ${getStrategyFailureReason(error)}`);
    }
  } else {
    console.log(`[Instagram Extractor] Strategy skipped: Instaloader disabled`);
  }

  console.error(`[Instagram Extractor] All extraction strategies failed`);
  throw new MediaNotFoundError(
    `Failed to extract Instagram media. ${failureReasons.join(" | ")}`,
  );
}
