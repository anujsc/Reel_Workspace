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
 * Extract audio from video to MP3
 */
export async function extractAudioToMp3(
  videoPath: string
): Promise<AudioExtractionResult> {
  await ensureAudioDirectory();

  const audioFileName = generateAudioFilename();
  const audioPath = path.join(TEMP_AUDIO_DIR, audioFileName);

  console.log(`[Audio Extractor] Extracting audio from ${videoPath}`);
  console.log(`[Audio Extractor] Output: ${audioPath}`);

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

    // Extract audio using ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat("mp3")
        .audioBitrate(128)
        .audioFrequency(44100)
        .audioChannels(2)
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

    // Verify output file exists
    try {
      const stats = await fs.stat(audioPath);
      if (stats.size === 0) {
        throw new AudioExtractionError("Extracted audio file is empty");
      }
      console.log(
        `[Audio Extractor] Audio file size: ${(stats.size / 1024).toFixed(2)}KB`
      );
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
