import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import { FileSystemError } from "../utils/errors.js";

/**
 * Frame extraction result
 */
export interface FrameExtractionResult {
  frames: Array<{
    timestamp: number;
    filePath: string;
  }>;
}

// OPTIMIZATION SETTINGS
const TEMP_FRAMES_DIR = path.join(process.cwd(), "temp", "frames");
const FRAME_INTERVAL_SECONDS = 7; // Extract frames every 7 seconds (5-10s range)
const MIN_FRAMES = 2; // Minimum frames to extract
const MAX_FRAMES = process.env.NODE_ENV === "production" ? 5 : 8; // Reduced for Render free tier
const FRAME_RESOLUTION = "960x540"; // Reduced from 1280x720 for faster processing

/**
 * Ensure temp frames directory exists
 */
async function ensureTempDirectory(): Promise<void> {
  try {
    await fs.mkdir(TEMP_FRAMES_DIR, { recursive: true });
  } catch (error) {
    throw new FileSystemError(
      `Failed to create temp frames directory: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
}

/**
 * Determine optimal frame sampling based on video duration
 * OPTIMIZED: Extract frames at 5-10 second intervals
 */
export function determineFrameSampling(durationSeconds: number): number[] {
  // Calculate number of frames to maintain 5-10s interval
  const idealFrameCount = Math.ceil(durationSeconds / FRAME_INTERVAL_SECONDS);
  const frameCount = Math.max(
    MIN_FRAMES,
    Math.min(MAX_FRAMES, idealFrameCount),
  );

  // Generate evenly distributed timestamps
  const timestamps: number[] = [];
  const interval = durationSeconds / (frameCount + 1);

  for (let i = 1; i <= frameCount; i++) {
    timestamps.push(Math.floor(interval * i));
  }

  return timestamps;
}

/**
 * Extract multiple frames from video at specified timestamps
 * OPTIMIZED: Parallel extraction with batch processing
 */
export async function extractFrames(
  videoPath: string,
  timestamps: number[],
): Promise<FrameExtractionResult> {
  await ensureTempDirectory();

  console.log(
    `[Frame Extractor] Extracting ${timestamps.length} frames from video (parallel mode)`,
  );

  // Extract all frames in parallel using Promise.allSettled
  const extractionPromises = timestamps.map(async (timestamp) => {
    const framePath = path.join(
      TEMP_FRAMES_DIR,
      `frame_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}_${timestamp}s.jpg`,
    );

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: path.basename(framePath),
            folder: TEMP_FRAMES_DIR,
            size: FRAME_RESOLUTION,
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

      console.log(`[Frame Extractor] ✓ Extracted frame at ${timestamp}s`);
      return { timestamp, filePath: framePath };
    } catch (error) {
      console.warn(
        `[Frame Extractor] Failed to extract frame at ${timestamp}s:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  });

  // Wait for all extractions to complete
  const results = await Promise.allSettled(extractionPromises);

  // Filter successful extractions
  const frames = results
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<{
        timestamp: number;
        filePath: string;
      } | null> => result.status === "fulfilled" && result.value !== null,
    )
    .map((result) => result.value!);

  console.log(
    `[Frame Extractor] Successfully extracted ${frames.length}/${timestamps.length} frames`,
  );

  return { frames };
}

/**
 * Delete frame files
 */
export async function deleteFrames(
  frames: Array<{ filePath: string }>,
): Promise<void> {
  for (const frame of frames) {
    try {
      await fs.unlink(frame.filePath);
      console.log(`[Frame Extractor] Deleted frame: ${frame.filePath}`);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.warn(
          `[Frame Extractor] Failed to delete frame ${frame.filePath}:`,
          error,
        );
      }
    }
  }
}
