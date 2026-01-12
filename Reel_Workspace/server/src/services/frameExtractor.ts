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

const TEMP_FRAMES_DIR = path.join(process.cwd(), "temp", "frames");

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
      }`
    );
  }
}

/**
 * Determine optimal frame sampling based on video duration
 */
export function determineFrameSampling(durationSeconds: number): number[] {
  if (durationSeconds < 15) {
    // Short reel: 3 frames (start, middle, end)
    return [
      1,
      Math.floor(durationSeconds / 2),
      Math.max(1, durationSeconds - 1),
    ];
  } else if (durationSeconds < 30) {
    // Medium reel: 5 frames
    return Array.from({ length: 5 }, (_, i) =>
      Math.floor((durationSeconds / 6) * (i + 1))
    );
  } else if (durationSeconds < 60) {
    // Long reel: 7 frames
    return Array.from({ length: 7 }, (_, i) =>
      Math.floor((durationSeconds / 8) * (i + 1))
    );
  } else {
    // Very long: 10 frames max
    return Array.from({ length: 10 }, (_, i) =>
      Math.floor((durationSeconds / 11) * (i + 1))
    );
  }
}

/**
 * Extract multiple frames from video at specified timestamps
 */
export async function extractFrames(
  videoPath: string,
  timestamps: number[]
): Promise<FrameExtractionResult> {
  await ensureTempDirectory();

  console.log(
    `[Frame Extractor] Extracting ${timestamps.length} frames from video`
  );
  const frames = [];

  for (const timestamp of timestamps) {
    const framePath = path.join(
      TEMP_FRAMES_DIR,
      `frame_${Date.now()}_${timestamp}s.jpg`
    );

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: path.basename(framePath),
            folder: TEMP_FRAMES_DIR,
            size: "1280x720",
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

      frames.push({ timestamp, filePath: framePath });
      console.log(`[Frame Extractor] ✓ Extracted frame at ${timestamp}s`);
    } catch (error) {
      console.warn(
        `[Frame Extractor] Failed to extract frame at ${timestamp}s:`,
        error instanceof Error ? error.message : error
      );
      // Continue with other frames even if one fails
    }
  }

  console.log(
    `[Frame Extractor] Successfully extracted ${frames.length}/${timestamps.length} frames`
  );

  return { frames };
}

/**
 * Delete frame files
 */
export async function deleteFrames(
  frames: Array<{ filePath: string }>
): Promise<void> {
  for (const frame of frames) {
    try {
      await fs.unlink(frame.filePath);
      console.log(`[Frame Extractor] Deleted frame: ${frame.filePath}`);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.warn(
          `[Frame Extractor] Failed to delete frame ${frame.filePath}:`,
          error
        );
      }
    }
  }
}
