import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import {
  ThumbnailGenerationError,
  CloudinaryUploadError,
  FileSystemError,
} from "../utils/errors.js";

/**
 * Result from thumbnail generation and upload
 */
export interface ThumbnailResult {
  thumbnailUrl: string;
  publicId: string;
}

const TEMP_THUMBNAIL_DIR = path.join(process.cwd(), "temp", "thumbnails");
const CLOUDINARY_FOLDER = "reels/thumbnails";

/**
 * Configure ffmpeg paths for Windows if needed
 */
function configureFfmpegPaths(): void {
  // Check if custom paths are set
  if (process.env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
  } else if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    // Try to find ffmpeg in winget installation directory
    const wingetFfmpegPath = path.join(
      process.env.LOCALAPPDATA,
      "Microsoft",
      "WinGet",
      "Packages",
      "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "ffmpeg-8.0.1-full_build",
      "bin",
      "ffmpeg.exe"
    );
    ffmpeg.setFfmpegPath(wingetFfmpegPath);
  }

  if (process.env.FFPROBE_PATH) {
    ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
  } else if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    // Try to find ffprobe in winget installation directory
    const wingetFfprobePath = path.join(
      process.env.LOCALAPPDATA,
      "Microsoft",
      "WinGet",
      "Packages",
      "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "ffmpeg-8.0.1-full_build",
      "bin",
      "ffprobe.exe"
    );
    ffmpeg.setFfprobePath(wingetFfprobePath);
  }
}

// Configure ffmpeg paths on module load
configureFfmpegPaths();

/**
 * Configure Cloudinary
 */
function configureCloudinary(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryUploadError(
      "Cloudinary credentials not configured in environment variables"
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/**
 * Ensure temp thumbnail directory exists
 */
async function ensureThumbnailDirectory(): Promise<void> {
  try {
    await fs.mkdir(TEMP_THUMBNAIL_DIR, { recursive: true });
  } catch (error) {
    throw new FileSystemError(
      `Failed to create thumbnail temp directory: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Generate unique thumbnail filename
 */
function generateThumbnailFilename(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `thumb_${timestamp}_${random}.jpg`;
}

/**
 * Capture frame from video at specific timestamp
 * Uses 9:16 aspect ratio to match mobile/reel format
 */
function captureFrame(
  videoPath: string,
  outputPath: string,
  timestamp: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "720x1280", // 9:16 aspect ratio for mobile/reel format
      })
      .on("end", () => {
        console.log(
          `[Thumbnail Service] Frame captured at ${timestamp}s (9:16 ratio)`
        );
        resolve();
      })
      .on("error", (err) => {
        console.error(`[Thumbnail Service] FFmpeg error:`, err);
        reject(err);
      });
  });
}

/**
 * Upload thumbnail to Cloudinary with 9:16 aspect ratio
 */
async function uploadToCloudinary(
  filePath: string
): Promise<{ url: string; publicId: string }> {
  try {
    console.log(`[Thumbnail Service] Uploading to Cloudinary (9:16 format)...`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: CLOUDINARY_FOLDER,
      resource_type: "image",
      format: "jpg",
      quality: 80,
      transformation: [
        { width: 720, height: 1280, crop: "limit" }, // 9:16 mobile ratio
        { quality: "auto:good" },
      ],
    });

    console.log(`[Thumbnail Service] Upload successful: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    // Handle Cloudinary-specific errors
    if (error.http_code === 420) {
      throw new CloudinaryUploadError(
        "Cloudinary rate limit exceeded. Please try again later."
      );
    }

    if (error.http_code === 400) {
      throw new CloudinaryUploadError(
        `Invalid upload request: ${error.message}`
      );
    }

    throw new CloudinaryUploadError(
      `Cloudinary upload failed: ${error.message || error}`
    );
  }
}

/**
 * Generate thumbnail from video and upload to Cloudinary
 */
export async function generateAndUploadThumbnail(
  videoPath: string
): Promise<ThumbnailResult> {
  // Configure Cloudinary
  configureCloudinary();

  await ensureThumbnailDirectory();

  const thumbnailFileName = generateThumbnailFilename();
  const thumbnailPath = path.join(TEMP_THUMBNAIL_DIR, thumbnailFileName);

  console.log(`[Thumbnail Service] Generating thumbnail from ${videoPath}`);

  try {
    // Try to capture frame at 2 seconds
    let captureSuccess = false;
    try {
      await captureFrame(videoPath, thumbnailPath, 2);
      captureSuccess = true;
    } catch (error) {
      console.warn(`[Thumbnail Service] Failed to capture at 2s, trying 1s...`);
      // Fallback to 1 second
      try {
        await captureFrame(videoPath, thumbnailPath, 1);
        captureSuccess = true;
      } catch (fallbackError) {
        console.warn(
          `[Thumbnail Service] Failed to capture at 1s, trying 0.5s...`
        );
        // Last attempt at 0.5 seconds
        await captureFrame(videoPath, thumbnailPath, 0.5);
        captureSuccess = true;
      }
    }

    if (!captureSuccess) {
      throw new ThumbnailGenerationError("Failed to capture frame from video");
    }

    // Verify thumbnail file exists
    try {
      const stats = await fs.stat(thumbnailPath);
      if (stats.size === 0) {
        throw new ThumbnailGenerationError("Generated thumbnail is empty");
      }
      console.log(
        `[Thumbnail Service] Thumbnail size: ${(stats.size / 1024).toFixed(
          2
        )}KB`
      );
    } catch (error) {
      throw new ThumbnailGenerationError(
        `Thumbnail verification failed: ${
          error instanceof Error ? error.message : error
        }`
      );
    }

    // Upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(thumbnailPath);

    // Delete local thumbnail file
    try {
      await fs.unlink(thumbnailPath);
      console.log(`[Thumbnail Service] Deleted local thumbnail`);
    } catch (error) {
      console.warn(
        `[Thumbnail Service] Failed to delete local thumbnail:`,
        error
      );
    }

    return {
      thumbnailUrl: url,
      publicId,
    };
  } catch (error) {
    // Clean up local file if it exists
    try {
      await fs.unlink(thumbnailPath);
    } catch {
      // Ignore cleanup errors
    }

    if (
      error instanceof ThumbnailGenerationError ||
      error instanceof CloudinaryUploadError
    ) {
      throw error;
    }

    throw new ThumbnailGenerationError(
      `Thumbnail generation failed: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}
