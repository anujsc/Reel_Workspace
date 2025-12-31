import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import {
  AudioExtractionError,
  InvalidMediaError,
  FileSystemError,
} from "../utils/errors.js";

/**
 * Result from audio extraction
 */
export interface AudioExtractionResult {
  audioPath: string;
  audioFileName: string;
  durationSeconds?: number;
}

const TEMP_AUDIO_DIR = path.join(process.cwd(), "temp", "audio");

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
 * Ensure temp audio directory exists
 */
async function ensureAudioDirectory(): Promise<void> {
  try {
    await fs.mkdir(TEMP_AUDIO_DIR, { recursive: true });
  } catch (error) {
    throw new FileSystemError(
      `Failed to create audio temp directory: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Generate unique audio filename
 */
function generateAudioFilename(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `audio_${timestamp}_${random}.mp3`;
}

/**
 * Get video duration using ffprobe
 */
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const duration = metadata.format.duration;
      if (duration && duration > 0) {
        resolve(duration);
      } else {
        reject(new Error("Invalid duration"));
      }
    });
  });
}

/**
 * Extract audio from video to MP3 with optimized FFmpeg settings
 */
export async function extractAudioToMp3(
  videoPath: string
): Promise<AudioExtractionResult> {
  await ensureAudioDirectory();

  const audioFileName = generateAudioFilename();
  const audioPath = path.join(TEMP_AUDIO_DIR, audioFileName);

  console.log(`[Audio Extractor] Extracting audio from ${videoPath}`);
  console.log(`[Audio Extractor] Output: ${audioPath}`);
  const perfStart = Date.now();

  try {
    // First, get video duration
    let durationSeconds: number | undefined;
    try {
      durationSeconds = await getVideoDuration(videoPath);
      console.log(
        `[Audio Extractor] Video duration: ${durationSeconds.toFixed(2)}s`
      );

      if (durationSeconds <= 0) {
        throw new InvalidMediaError("Video duration is invalid or zero");
      }
    } catch (error) {
      console.warn(
        `[Audio Extractor] Could not determine duration:`,
        error instanceof Error ? error.message : error
      );
    }

    // OPTIMIZATION: Try codec copy first (instant if source is compatible)
    let extractionSuccess = false;
    
    try {
      console.log(`[Audio Extractor] Attempting fast codec copy...`);
      await extractAudioWithCopy(videoPath, audioPath);
      extractionSuccess = true;
      console.log(`[Audio Extractor] ✓ Fast codec copy successful`);
    } catch (copyError) {
      console.log(`[Audio Extractor] Codec copy failed, re-encoding with optimizations...`);
      
      // Fallback: Extract with optimized re-encoding
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .toFormat("mp3")
          .audioBitrate(128)
          .audioFrequency(44100)
          .audioChannels(2)
          // OPTIMIZATION: Multi-threading and fast preset
          .outputOptions([
            "-threads", "0",           // Auto-detect CPU cores
            "-vn",                     // Skip video processing entirely
            "-preset", "ultrafast",    // Fastest encoding preset
          ])
          .on("start", (commandLine) => {
            console.log(`[Audio Extractor] FFmpeg command: ${commandLine}`);
          })
          .on("progress", (progress) => {
            if (progress.percent) {
              console.log(
                `[Audio Extractor] Progress: ${progress.percent.toFixed(1)}%`
              );
            }
          })
          .on("end", () => {
            console.log(`[Audio Extractor] Audio extraction complete`);
            resolve();
          })
          .on("error", (err) => {
            console.error(`[Audio Extractor] FFmpeg error:`, err);
            reject(err);
          })
          .save(audioPath);
      });
      
      extractionSuccess = true;
    }

    // Verify output file exists
    try {
      const stats = await fs.stat(audioPath);
      if (stats.size === 0) {
        throw new AudioExtractionError("Extracted audio file is empty");
      }
      const extractTime = Date.now() - perfStart;
      console.log(
        `[Audio Extractor] Audio file size: ${(stats.size / 1024).toFixed(2)}KB`
      );
      console.log(`[Audio Extractor] Extraction time: ${extractTime}ms`);
    } catch (error) {
      throw new AudioExtractionError(
        `Audio file verification failed: ${
          error instanceof Error ? error.message : error
        }`
      );
    }

    return {
      audioPath,
      audioFileName,
      durationSeconds,
    };
  } catch (error) {
    // Clean up partial file if it exists
    try {
      await fs.unlink(audioPath);
    } catch {
      // Ignore cleanup errors
    }

    if (
      error instanceof AudioExtractionError ||
      error instanceof InvalidMediaError
    ) {
      throw error;
    }

    throw new AudioExtractionError(
      `Failed to extract audio: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Try to extract audio using codec copy (no re-encoding)
 * This is much faster but only works if source codec is compatible
 */
async function extractAudioWithCopy(
  videoPath: string,
  outputPath: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Codec copy timeout"));
    }, 3000); // Should be instant, timeout after 3s

    ffmpeg(videoPath)
      .outputOptions([
        "-vn",              // No video
        "-acodec", "copy",  // Copy audio stream without re-encoding
      ])
      .on("end", () => {
        clearTimeout(timeout);
        resolve();
      })
      .on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Delete audio file from disk
 */
export async function deleteAudioFile(audioPath: string): Promise<void> {
  try {
    await fs.unlink(audioPath);
    console.log(`[Audio Extractor] Deleted audio file: ${audioPath}`);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log(`[Audio Extractor] Audio file already deleted: ${audioPath}`);
      return;
    }
    console.error(
      `[Audio Extractor] Failed to delete audio file ${audioPath}:`,
      error
    );
  }
}
