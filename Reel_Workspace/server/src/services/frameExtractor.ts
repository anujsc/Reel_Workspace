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
const FRAME_INTERVAL_SECONDS = 10; // Extract frames every 10 seconds (faster)
const MIN_FRAMES = 2; // Minimum frames to extract
const MAX_FRAMES = 3; // Reduced to 3 for speed (was 5)
const FRAME_RESOLUTION = "640x360"; // Further reduced for speed (was 960x540)

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
 * OPTIMIZED: Single ffmpeg command for all frames (much faster!)
 */
export async function extractFrames(
  videoPath: string,
  timestamps: number[],
): Promise<FrameExtractionResult> {
  await ensureTempDirectory();

  console.log(
    `[Frame Extractor] Extracting ${timestamps.length} frames from video (optimized single-pass mode)`,
  );

  const frames: Array<{ timestamp: number; filePath: string }> = [];
  const baseFilename = `frame_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    // Extract all frames in a SINGLE ffmpeg command (much faster!)
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: timestamps,
          filename: `${baseFilename}_%i.jpg`,
          folder: TEMP_FRAMES_DIR,
          size: FRAME_RESOLUTION,
        })
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    // Map extracted files to timestamps
    for (let i = 0; i < timestamps.length; i++) {
      const framePath = path.join(
        TEMP_FRAMES_DIR,
        `${baseFilename}_${i + 1}.jpg`,
      );
      frames.push({
        timestamp: timestamps[i],
        filePath: framePath,
      });
      console.log(`[Frame Extractor] ✓ Extracted frame at ${timestamps[i]}s`);
    }

    console.log(
      `[Frame Extractor] Successfully extracted ${frames.length}/${timestamps.length} frames in single pass`,
    );

    return { frames };
  } catch (error) {
    console.error(
      `[Frame Extractor] Failed to extract frames:`,
      error instanceof Error ? error.message : error,
    );

    // Fallback: try to extract at least one frame
    console.log(`[Frame Extractor] Attempting fallback extraction...`);
    const fallbackTimestamp = timestamps[Math.floor(timestamps.length / 2)];
    const fallbackPath = path.join(
      TEMP_FRAMES_DIR,
      `${baseFilename}_fallback.jpg`,
    );

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [fallbackTimestamp],
            filename: path.basename(fallbackPath),
            folder: TEMP_FRAMES_DIR,
            size: FRAME_RESOLUTION,
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

      return {
        frames: [{ timestamp: fallbackTimestamp, filePath: fallbackPath }],
      };
    } catch (fallbackError) {
      throw new FileSystemError(
        `Failed to extract frames: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }
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
