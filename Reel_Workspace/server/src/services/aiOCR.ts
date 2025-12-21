import { GoogleGenerativeAI } from "@google/generative-ai";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import { OcrError, FileSystemError } from "../utils/errors.js";

/**
 * Result from OCR extraction
 */
export interface OcrResult {
  text: string;
  rawResponse?: unknown;
}

const TEMP_FRAMES_DIR = path.join(process.cwd(), "temp", "frames");
const FRAME_COUNT = 5; // Number of frames to extract

/**
 * Initialize Gemini AI
 */
function initializeGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new OcrError(
      "GEMINI_API_KEY not configured in environment variables"
    );
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Ensure temp frames directory exists
 */
async function ensureFramesDirectory(): Promise<void> {
  try {
    await fs.mkdir(TEMP_FRAMES_DIR, { recursive: true });
  } catch (error) {
    throw new FileSystemError(
      `Failed to create frames temp directory: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Get video duration
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
 * Extract frames from video at specific timestamps
 */
async function extractFrames(
  videoPath: string,
  duration: number
): Promise<string[]> {
  const framePaths: string[] = [];
  const timestamps: number[] = [];

  // Calculate timestamps at 10%, 30%, 50%, 70%, 90%
  const percentages = [0.1, 0.3, 0.5, 0.7, 0.9];
  for (const percent of percentages) {
    timestamps.push(duration * percent);
  }

  console.log(
    `[AI OCR] Extracting ${FRAME_COUNT} frames at timestamps:`,
    timestamps.map((t) => `${t.toFixed(2)}s`)
  );

  // Extract each frame
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const frameFileName = `frame_${Date.now()}_${i}.jpg`;
    const framePath = path.join(TEMP_FRAMES_DIR, frameFileName);

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: frameFileName,
            folder: TEMP_FRAMES_DIR,
            size: "1280x720",
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

      framePaths.push(framePath);
      console.log(`[AI OCR] Extracted frame ${i + 1}/${FRAME_COUNT}`);
    } catch (error) {
      console.warn(`[AI OCR] Failed to extract frame at ${timestamp}s:`, error);
    }
  }

  if (framePaths.length === 0) {
    throw new OcrError("Failed to extract any frames from video");
  }

  return framePaths;
}

/**
 * Convert image to base64
 */
async function imageToBase64(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString("base64");
  } catch (error) {
    throw new OcrError(
      `Failed to read image file: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Clean up frame files
 */
async function cleanupFrames(framePaths: string[]): Promise<void> {
  for (const framePath of framePaths) {
    try {
      await fs.unlink(framePath);
    } catch (error) {
      console.warn(`[AI OCR] Failed to delete frame ${framePath}:`, error);
    }
  }
}

/**
 * Deduplicate and normalize text lines
 */
function deduplicateText(texts: string[]): string {
  const lines = texts
    .join("\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Remove duplicate lines (case-insensitive)
  const uniqueLines = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (!uniqueLines.has(lowerLine)) {
      uniqueLines.add(lowerLine);
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * Extract OCR text from video using Gemini Vision
 */
export async function extractOcrFromVideoWithGemini(
  videoPath: string
): Promise<OcrResult> {
  console.log(`[AI OCR] Starting OCR extraction for ${videoPath}`);

  await ensureFramesDirectory();

  let framePaths: string[] = [];

  try {
    // Get video duration
    const duration = await getVideoDuration(videoPath);
    console.log(`[AI OCR] Video duration: ${duration.toFixed(2)}s`);

    // Extract frames
    framePaths = await extractFrames(videoPath, duration);

    if (framePaths.length === 0) {
      console.warn(`[AI OCR] No frames extracted, returning empty text`);
      return {
        text: "",
        rawResponse: null,
      };
    }

    // Initialize Gemini
    const genAI = initializeGemini();
    // Use Gemini Pro Vision for OCR
    const model = genAI.getGenerativeModel({
     model: "gemini-2.5-flash"  // or "gemini-2.5-flash"

    });

    // Prepare image parts for Gemini
    const imageParts = await Promise.all(
      framePaths.map(async (framePath) => {
        const base64Data = await imageToBase64(framePath);
        return {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        };
      })
    );

    console.log(
      `[AI OCR] Sending ${imageParts.length} frames to Gemini Vision...`
    );

    // Create prompt
    const prompt =
      "Extract all readable text from these video frames. This includes any on-screen text, captions, subtitles, overlays, or visible text elements. Return only the extracted text as plain text, one line per distinct text element. If no text is visible, return 'NO_TEXT_FOUND'.";

    // Send request to Gemini
    const result = await model.generateContent([...imageParts, prompt]);

    const response = result.response;
    const responseText = response.text().trim();

    // Check if no text was found
    if (
      responseText === "NO_TEXT_FOUND" ||
      responseText.toLowerCase().includes("no text") ||
      responseText.length === 0
    ) {
      console.log(`[AI OCR] No text detected in frames`);
      return {
        text: "",
        rawResponse: response,
      };
    }

    // Deduplicate and normalize text
    const normalizedText = deduplicateText([responseText]);

    console.log(
      `[AI OCR] OCR extraction complete: ${normalizedText.length} characters`
    );

    return {
      text: normalizedText,
      rawResponse: response,
    };
  } catch (error: any) {
    // Handle Gemini-specific errors
    if (error.message?.includes("API key")) {
      throw new OcrError("Invalid Gemini API key");
    }

    if (error.message?.includes("quota")) {
      throw new OcrError("Gemini API quota exceeded. Please try again later.");
    }

    if (error.message?.includes("safety")) {
      console.warn(`[AI OCR] Content blocked by safety filters`);
      return {
        text: "",
        rawResponse: null,
      };
    }

    // For OCR, we don't throw on failures - just return empty text
    console.error(`[AI OCR] OCR extraction failed:`, error);
    return {
      text: "",
      rawResponse: null,
    };
  } finally {
    // Always clean up frames
    if (framePaths.length > 0) {
      await cleanupFrames(framePaths);
      console.log(`[AI OCR] Cleaned up ${framePaths.length} frame files`);
    }
  }
}
