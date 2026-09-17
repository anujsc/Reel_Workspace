import axios from "axios";
import { downloadVideo } from "./videoDownloader.js";
import type { InstagramMediaResult } from "./instagramFetcher.js";
import { SocialKitConfigurationError } from "../utils/errors.js";

const SOCIALKIT_DOWNLOAD_ENDPOINT =
  "https://api.socialkit.dev/instagram/download";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 1024 * 1024;

export type SocialKitFailureCode =
  | "AUTHENTICATION_ERROR"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "MEDIA_NOT_FOUND"
  | "UNSUPPORTED_MEDIA"
  | "INVALID_RESPONSE"
  | "SERVICE_ERROR"
  | "DOWNLOAD_ERROR";

export class SocialKitExtractionError extends Error {
  public readonly code: SocialKitFailureCode;
  public readonly statusCode?: number;
  public readonly retryable?: boolean;

  constructor(
    code: SocialKitFailureCode,
    message: string,
    options?: { statusCode?: number; retryable?: boolean },
  ) {
    super(message);
    this.name = "SocialKitExtractionError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.retryable = options?.retryable;
  }
}

interface SocialKitResponseData {
  downloadUrl?: unknown;
  download_url?: unknown;
  videoUrl?: unknown;
  video_url?: unknown;
  mediaUrl?: unknown;
  media_url?: unknown;
  title?: unknown;
  durationSeconds?: unknown;
  thumbnail?: unknown;
}

interface SocialKitResponseEnvelope {
  success?: unknown;
  data?: unknown;
  errorCode?: unknown;
  code?: unknown;
  retryable?: unknown;
}

function getTimeoutMs(): number {
  const configured = Number.parseInt(
    process.env.SOCIALKIT_TIMEOUT_MS || "",
    10,
  );

  if (!Number.isNaN(configured) && configured >= 1000) {
    return configured;
  }

  return DEFAULT_TIMEOUT_MS;
}

function getAccessKey(): string {
  const accessKey = process.env.SOCIALKIT_ACCESS_KEY?.trim();
  if (!accessKey) {
    throw new SocialKitConfigurationError(
      "SOCIALKIT_ACCESS_KEY is not configured for the backend",
    );
  }

  return accessKey;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function getFailureCode(
  statusCode: number,
  errorCode: string | undefined,
): SocialKitFailureCode {
  if (statusCode === 401 || statusCode === 403) {
    return "AUTHENTICATION_ERROR";
  }

  if (statusCode === 429 || errorCode === "rate_limited") {
    return "RATE_LIMITED";
  }

  if (
    ["content_unavailable", "content_restricted"].includes(
      errorCode || "",
    ) ||
    statusCode === 404
  ) {
    return "MEDIA_NOT_FOUND";
  }

  if (
    ["unsupported_format", "file_too_large", "duration_limit_exceeded"].includes(
      errorCode || "",
    ) ||
    statusCode === 422
  ) {
    return "UNSUPPORTED_MEDIA";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "INVALID_RESPONSE";
  }

  return "SERVICE_ERROR";
}

function getApiErrorCode(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;

  return (
    getString(payload.errorCode) ||
    getString(payload.code) ||
    getString(payload.error)
  )?.toLowerCase();
}

function throwForApiFailure(
  statusCode: number,
  payload: unknown,
): never {
  const errorCode = getApiErrorCode(payload);
  const code = getFailureCode(statusCode, errorCode);
  const retryable = isRecord(payload) && payload.retryable === true;

  throw new SocialKitExtractionError(
    code,
    `SocialKit request failed (${code})`,
    { statusCode, retryable },
  );
}

function normalizeResponse(payload: unknown): {
  mediaUrl: string;
  title?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
} {
  if (!isRecord(payload)) {
    throw new SocialKitExtractionError(
      "INVALID_RESPONSE",
      "SocialKit returned a malformed response",
    );
  }

  if (payload.success !== true) {
    throwForApiFailure(200, payload);
  }

  if (!isRecord(payload.data)) {
    throw new SocialKitExtractionError(
      "INVALID_RESPONSE",
      "SocialKit response did not include media data",
    );
  }

  const data = payload.data as SocialKitResponseData;
  const mediaUrl = [
    data.downloadUrl,
    data.download_url,
    data.videoUrl,
    data.video_url,
    data.mediaUrl,
    data.media_url,
  ]
    .map(getString)
    .find((value): value is string => Boolean(value && isHttpUrl(value)));

  if (!mediaUrl) {
    throw new SocialKitExtractionError(
      "INVALID_RESPONSE",
      "SocialKit response did not include a valid downloadable media URL",
    );
  }

  const durationValue = data.durationSeconds;
  const durationSeconds =
    typeof durationValue === "number" && Number.isFinite(durationValue)
      ? durationValue
      : undefined;

  return {
    mediaUrl,
    title: getString(data.title),
    durationSeconds,
    thumbnailUrl: getString(data.thumbnail),
  };
}

export async function extractWithSocialKit(
  cleanUrl: string,
): Promise<InstagramMediaResult> {
  const accessKey = getAccessKey();
  const timeoutMs = getTimeoutMs();
  console.log(`[Instagram Extractor] SocialKit request started`);

  let response;
  try {
    response = await axios.post<SocialKitResponseEnvelope>(
      SOCIALKIT_DOWNLOAD_ENDPOINT,
      {
        access_key: accessKey,
        url: cleanUrl,
        format: "mp4",
        quality: "480p",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-access-key": accessKey,
        },
        timeout: timeoutMs,
        maxContentLength: MAX_RESPONSE_BYTES,
        maxBodyLength: MAX_RESPONSE_BYTES,
        validateStatus: () => true,
      },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new SocialKitExtractionError(
          "TIMEOUT",
          `SocialKit request timed out after ${timeoutMs}ms`,
        );
      }

      throw new SocialKitExtractionError(
        "NETWORK_ERROR",
        "SocialKit request failed due to a network error",
      );
    }

    throw new SocialKitExtractionError(
      "SERVICE_ERROR",
      "SocialKit request failed unexpectedly",
    );
  }

  if (response.status < 200 || response.status >= 300) {
    throwForApiFailure(response.status, response.data);
  }

  const normalized = normalizeResponse(response.data);
  console.log(`[Instagram Extractor] Media URL received`);

  try {
    console.log(`[Instagram Extractor] Downloading media`);
    const downloaded = await downloadVideo(normalized.mediaUrl);
    console.log(`[Instagram Extractor] SocialKit extraction successful`);

    return {
      source: "socialkit",
      sourceUrl: cleanUrl,
      videoUrl: cleanUrl,
      localFilePath: downloaded.filePath,
      title: normalized.title,
      thumbnailUrl: normalized.thumbnailUrl,
      durationSeconds: normalized.durationSeconds,
    };
  } catch (error) {
    throw new SocialKitExtractionError(
      "DOWNLOAD_ERROR",
      `SocialKit media download failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
}
