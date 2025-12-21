import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import { TranscriptionError } from "../utils/errors.js";

/**
 * Result from AI transcription
 */
export interface TranscriptResult {
  transcript: string;
  rawResponse?: unknown;
}

const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB limit for Gemini

/**
 * Initialize Gemini AI
 */
function initializeGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new TranscriptionError(
      "GEMINI_API_KEY not configured in environment variables"
    );
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Convert audio file to base64
 */
async function audioToBase64(audioPath: string): Promise<string> {
  try {
    const audioBuffer = await fs.readFile(audioPath);
    return audioBuffer.toString("base64");
  } catch (error) {
    throw new TranscriptionError(
      `Failed to read audio file: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Check audio file size
 */
async function checkAudioSize(audioPath: string): Promise<number> {
  try {
    const stats = await fs.stat(audioPath);
    return stats.size;
  } catch (error) {
    throw new TranscriptionError(
      `Failed to check audio file size: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Transcribe audio using Google Gemini
 */
export async function transcribeAudioWithGemini(
  audioPath: string
): Promise<TranscriptResult> {
  console.log(`[AI Transcript] Starting transcription for ${audioPath}`);

  // Check file size
  const fileSize = await checkAudioSize(audioPath);
  console.log(
    `[AI Transcript] Audio file size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
  );

  if (fileSize > MAX_AUDIO_SIZE) {
    throw new TranscriptionError(
      `Audio file too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB (max ${
        MAX_AUDIO_SIZE / 1024 / 1024
      }MB)`
    );
  }

  if (fileSize === 0) {
    throw new TranscriptionError("Audio file is empty");
  }

  try {
    const genAI = initializeGemini();

    // Use Gemini Pro for audio transcription
    const model = genAI.getGenerativeModel({
       model: "gemini-2.5-flash"  // or "gemini-2.5-flash"
    });

    // Read audio file as base64
    const audioBase64 = await audioToBase64(audioPath);

    console.log(`[AI Transcript] Sending request to Gemini...`);

    // Create the prompt
    const prompt =
      "Transcribe the following audio accurately. Return only the spoken text in the same language. Do not add any commentary, explanations, or formatting. Just provide the raw transcript.";

    // Generate content with audio
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: audioBase64,
        },
      },
      prompt,
    ]);

    const response = result.response;
    const transcript = response.text();

    if (!transcript || transcript.trim().length === 0) {
      throw new TranscriptionError(
        "Gemini returned empty transcript. The audio may not contain speech."
      );
    }

    console.log(
      `[AI Transcript] Transcription complete: ${transcript.length} characters`
    );

    return {
      transcript: transcript.trim(),
      rawResponse: response,
    };
  } catch (error: any) {
    // Handle Gemini-specific errors
    if (error.message?.includes("API key")) {
      throw new TranscriptionError("Invalid Gemini API key");
    }

    if (error.message?.includes("quota")) {
      throw new TranscriptionError(
        "Gemini API quota exceeded. Please try again later."
      );
    }

    if (error.message?.includes("safety")) {
      throw new TranscriptionError(
        "Content was blocked by Gemini safety filters"
      );
    }

    if (error instanceof TranscriptionError) {
      throw error;
    }

    throw new TranscriptionError(
      `Transcription failed: ${error.message || error}`
    );
  }
}
