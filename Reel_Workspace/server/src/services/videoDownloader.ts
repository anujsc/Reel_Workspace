import axios, { AxiosError } from "axios";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { VideoDownloadError, FileSystemError } from "../utils/errors.js";

/**
 * Result from video download
 */
export interface DownloadedVideoResult {
  filePath: string;
  fileName: string;
  sizeBytes: number;
}

const TEMP_VIDEO_DIR = path.join(process.cwd(), "temp", "videos");
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const DOWNLOAD_TIMEOUT = 120000; // 2 minutes

/**
 * Ensure temp directory exists
 */
async function ensureTempDirectory(): Promise<void> {
  try {
    await fs.mkdir(TEMP_VIDEO_DIR, { recursive: true });
  } catch (error) {
    throw new FileSystemError(
      `Failed to create temp directory: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `video_${timestamp}_${random}.mp4`;
}

/**
 * Download video from URL to temp directory
 */
export async function downloadVideo(
  videoUrl: string
): Promise<DownloadedVideoResult> {
  await ensureTempDirectory();

  const fileName = generateUniqueFilename();
  const filePath = path.join(TEMP_VIDEO_DIR, fileName);

  console.log(`[Video Downloader] Starting download from ${videoUrl}`);
  console.log(`[Video Downloader] Saving to ${filePath}`);

  try {
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
      timeout: DOWNLOAD_TIMEOUT,
      maxContentLength: MAX_FILE_SIZE,
      maxBodyLength: MAX_FILE_SIZE,
    });

    // Check content length
    const contentLength = parseInt(
      response.headers["content-length"] || "0",
      10
    );
    if (contentLength > MAX_FILE_SIZE) {
      throw new VideoDownloadError(
        `Video file too large: ${(contentLength / 1024 / 1024).toFixed(
          2
        )}MB (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      );
    }

    return new Promise<DownloadedVideoResult>((resolve, reject) => {
      const writer = createWriteStream(filePath);
      let downloadedBytes = 0;
      let lastLoggedPercent = 0;

      response.data.on("data", (chunk: Buffer) => {
        downloadedBytes += chunk.length;

        // Log progress every 10%
        if (contentLength > 0) {
          const percent = Math.floor((downloadedBytes / contentLength) * 100);
          if (percent >= lastLoggedPercent + 10) {
            console.log(
              `[Video Downloader] Progress: ${percent}% (${(
                downloadedBytes /
                1024 /
                1024
              ).toFixed(2)}MB)`
            );
            lastLoggedPercent = percent;
          }
        }

        // Check if exceeding max size
        if (downloadedBytes > MAX_FILE_SIZE) {
          writer.destroy();
          response.data.destroy();
          reject(
            new VideoDownloadError(
              `Download exceeded maximum file size of ${
                MAX_FILE_SIZE / 1024 / 1024
              }MB`
            )
          );
        }
      });

      response.data.pipe(writer);

      writer.on("finish", () => {
        console.log(
          `[Video Downloader] Download complete: ${(
            downloadedBytes /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
        resolve({
          filePath,
          fileName,
          sizeBytes: downloadedBytes,
        });
      });

      writer.on("error", (error) => {
        reject(
          new FileSystemError(`Failed to write video file: ${error.message}`)
        );
      });

      response.data.on("error", (error: Error) => {
        reject(
          new VideoDownloadError(`Failed to download video: ${error.message}`)
        );
      });
    });
  } catch (error) {
    // Clean up partial file if it exists
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === "ECONNABORTED") {
        throw new VideoDownloadError(
          "Download timeout - video took too long to download"
        );
      }
      throw new VideoDownloadError(
        `Network error during download: ${axiosError.message}`
      );
    }

    if (
      error instanceof VideoDownloadError ||
      error instanceof FileSystemError
    ) {
      throw error;
    }

    throw new VideoDownloadError(
      `Unexpected error during download: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Delete a file from disk
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    console.log(`[Video Downloader] Deleted file: ${filePath}`);
  } catch (error: any) {
    // Gracefully handle "file not found" errors
    if (error.code === "ENOENT") {
      console.log(`[Video Downloader] File already deleted: ${filePath}`);
      return;
    }
    console.error(
      `[Video Downloader] Failed to delete file ${filePath}:`,
      error
    );
  }
}
