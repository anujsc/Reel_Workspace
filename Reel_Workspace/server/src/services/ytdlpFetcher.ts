import { exec } from "child_process";
import { promisify } from "util";
import {
  MediaNotFoundError,
  InvalidInstagramUrlError,
  PrivateMediaError,
} from "../utils/errors.js";

const execAsync = promisify(exec);

/**
 * Result from yt-dlp fetch
 */
export interface YtDlpResult {
  sourceUrl: string;
  videoUrl: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

/**
 * yt-dlp metadata structure
 */
interface YtDlpMetadata {
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  url?: string;
  webpage_url?: string;
}

/**
 * Get yt-dlp command path (handles Windows winget installation)
 */
function getYtDlpCommand(): string {
  // Check if custom path is set in environment
  if (process.env.YTDLP_PATH) {
    return process.env.YTDLP_PATH;
  }

  // On Windows, check common winget installation path
  if (process.platform === "win32") {
    const wingetPath = process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe\\yt-dlp.exe`
      : null;

    if (wingetPath) {
      return `"${wingetPath}"`;
    }
  }

  // Default to 'yt-dlp' in PATH
  return "yt-dlp";
}

/**
 * Check if yt-dlp is installed
 */
async function checkYtDlpInstalled(): Promise<boolean> {
  try {
    const ytdlpCmd = getYtDlpCommand();
    await execAsync(`${ytdlpCmd} --version`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch Instagram media using yt-dlp
 */
export async function fetchInstagramMediaWithYtDlp(
  instagramUrl: string
): Promise<YtDlpResult> {
  console.log(`[yt-dlp] Starting fetch for: ${instagramUrl}`);

  // Check if yt-dlp is installed
  const isInstalled = await checkYtDlpInstalled();
  if (!isInstalled) {
    throw new MediaNotFoundError(
      "yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp#installation"
    );
  }

  try {
    // Get both metadata and direct URL in one call
    console.log(`[yt-dlp] Fetching metadata and video URL...`);

    const ytdlpCmd = getYtDlpCommand();
    const command = `${ytdlpCmd} -j --no-warnings "${instagramUrl}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (stderr && stderr.includes("ERROR")) {
      console.error(`[yt-dlp] Error output:`, stderr);

      // Check for specific errors
      if (
        stderr.includes("Private video") ||
        stderr.includes("login required")
      ) {
        throw new PrivateMediaError("Cannot access private Instagram content");
      }

      if (
        stderr.includes("Video unavailable") ||
        stderr.includes("not available")
      ) {
        throw new MediaNotFoundError(
          "Instagram media not found or has been deleted"
        );
      }

      throw new MediaNotFoundError(`yt-dlp error: ${stderr}`);
    }

    // Parse JSON metadata
    const metadata: YtDlpMetadata = JSON.parse(stdout.trim());

    console.log(`[yt-dlp] Successfully fetched metadata`);
    console.log(`[yt-dlp] Title: ${metadata.title || "N/A"}`);
    console.log(
      `[yt-dlp] Duration: ${
        metadata.duration ? `${metadata.duration}s` : "N/A"
      }`
    );

    // Get direct video URL
    let videoUrl = metadata.url;

    // If URL is not in metadata, fetch it separately
    if (!videoUrl) {
      console.log(`[yt-dlp] Fetching direct video URL...`);
      const { stdout: urlOutput } = await execAsync(
        `${ytdlpCmd} -f best --get-url --no-warnings "${instagramUrl}"`,
        { timeout: 30000 }
      );
      videoUrl = urlOutput.trim();
    }

    if (!videoUrl) {
      throw new MediaNotFoundError(
        "Could not extract video URL from Instagram"
      );
    }

    console.log(`[yt-dlp] Video URL obtained successfully`);

    return {
      sourceUrl: instagramUrl,
      videoUrl,
      title: metadata.title,
      description: metadata.description,
      thumbnailUrl: metadata.thumbnail,
      durationSeconds: metadata.duration,
    };
  } catch (error: any) {
    // Handle specific yt-dlp errors
    if (
      error instanceof PrivateMediaError ||
      error instanceof MediaNotFoundError
    ) {
      throw error;
    }

    // Check for command not found
    if (error.code === "ENOENT" || error.message?.includes("not found")) {
      throw new MediaNotFoundError(
        "yt-dlp is not installed or not in PATH. Install from: https://github.com/yt-dlp/yt-dlp#installation"
      );
    }

    // Check for timeout
    if (error.killed || error.signal === "SIGTERM") {
      throw new MediaNotFoundError(
        "yt-dlp request timed out. The video may be too large or network is slow."
      );
    }

    // Parse error message
    const errorMessage = error.stderr || error.message || String(error);

    if (errorMessage.includes("Unsupported URL")) {
      throw new InvalidInstagramUrlError("Invalid Instagram URL format");
    }

    if (
      errorMessage.includes("Private video") ||
      errorMessage.includes("login")
    ) {
      throw new PrivateMediaError("Cannot access private Instagram content");
    }

    if (
      errorMessage.includes("not available") ||
      errorMessage.includes("removed")
    ) {
      throw new MediaNotFoundError(
        "Instagram media not found or has been deleted"
      );
    }

    console.error(`[yt-dlp] Unexpected error:`, error);
    throw new MediaNotFoundError(
      `Failed to fetch Instagram media with yt-dlp: ${errorMessage}`
    );
  }
}

/**
 * Get yt-dlp version for debugging
 */
export async function getYtDlpVersion(): Promise<string | null> {
  try {
    const ytdlpCmd = getYtDlpCommand();
    const { stdout } = await execAsync(`${ytdlpCmd} --version`, {
      timeout: 5000,
    });
    return stdout.trim();
  } catch (error) {
    return null;
  }
}
