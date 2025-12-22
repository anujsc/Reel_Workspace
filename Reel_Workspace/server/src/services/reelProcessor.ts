import { fetchInstagramMedia } from "./instagramFetcher.js";
import { downloadVideo, deleteFile } from "./videoDownloader.js";
import { extractAudioToMp3, deleteAudioFile } from "./audioExtractor.js";
import {
  generateAndUploadThumbnail,
  ThumbnailResult,
} from "./thumbnailService.js";
import { transcribeAudioWithGemini } from "./aiTranscript.js";
import { summarizeWithGroq } from "./aiSummary.js";
import { extractTextFromImage, OCRResult } from "./aiOCR.js";
import { ReelProcessingError } from "../utils/errors.js";

/**
 * Complete result from reel processing
 */
export interface ReelProcessingResult {
  sourceUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  transcript: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  examples: string[];
  relatedTopics: string[];
  actionableChecklist: string[];
  quizQuestions: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  quickReferenceCard: {
    facts: string[];
    definitions: string[];
    formulas: string[];
  };
  learningPath: string[];
  commonPitfalls: Array<{
    pitfall: string;
    solution: string;
  }>;
  glossary: Array<{
    term: string;
    definition: string;
  }>;
  interactivePromptSuggestions: string[];
  tags: string[];
  suggestedFolder: string;
  ocrText: string;
  metadata?: {
    durationSeconds?: number;
    title?: string;
    description?: string;
  };
  timings?: {
    fetchMs: number;
    downloadMs: number;
    audioExtractMs: number;
    thumbnailMs: number;
    transcriptionMs: number;
    summarizationMs: number;
    ocrMs: number;
    totalMs: number;
  };
}

/**
 * Measures the execution time of an async function
 *
 * @template T - The return type of the function
 * @param {() => Promise<T>} fn - The async function to measure
 * @returns {Promise<{result: T, durationMs: number}>} The function result and execution time in milliseconds
 */
async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;
  return { result, durationMs };
}

/**
 * Master orchestrator for processing Instagram Reels
 *
 * This function coordinates the entire reel extraction pipeline:
 * 1. Fetches Instagram media metadata
 * 2. Downloads the video file
 * 3. Extracts audio from video
 * 4. Generates and uploads thumbnail
 * 5. Transcribes audio using Gemini AI
 * 6. Generates comprehensive summary using Groq AI
 * 7. Extracts text from video frames using OCR
 *
 * All temporary files are automatically cleaned up after processing.
 *
 * @param {string} instagramUrl - The Instagram reel URL to process
 * @returns {Promise<ReelProcessingResult>} Complete processing result with all extracted data
 * @throws {ReelProcessingError} If any step in the pipeline fails
 *
 * @example
 * const result = await processReel('https://www.instagram.com/reel/ABC123/');
 * console.log(result.summary); // AI-generated summary
 * console.log(result.tags); // Auto-generated tags
 */
export async function processReel(
  instagramUrl: string
): Promise<ReelProcessingResult> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[Reel Processor] Starting processing for: ${instagramUrl}`);
  console.log(`${"=".repeat(60)}\n`);

  const startTime = Date.now();
  const tempFiles: string[] = [];

  try {
    // Step 1: Fetch Instagram media
    console.log(`\n[Step 1/7] Fetching Instagram media...`);
    const { result: mediaResult, durationMs: fetchMs } = await measureTime(() =>
      fetchInstagramMedia(instagramUrl)
    );
    console.log(`✓ Fetch complete in ${fetchMs}ms`);

    // Step 2: Download video
    console.log(`\n[Step 2/7] Downloading video...`);
    const { result: videoResult, durationMs: downloadMs } = await measureTime(
      () => downloadVideo(mediaResult.videoUrl)
    );
    tempFiles.push(videoResult.filePath);
    console.log(
      `✓ Download complete in ${downloadMs}ms (${(
        videoResult.sizeBytes /
        1024 /
        1024
      ).toFixed(2)}MB)`
    );

    // Step 3: Extract audio
    console.log(`\n[Step 3/7] Extracting audio...`);
    const { result: audioResult, durationMs: audioExtractMs } =
      await measureTime(() => extractAudioToMp3(videoResult.filePath));
    tempFiles.push(audioResult.audioPath);
    console.log(`✓ Audio extraction complete in ${audioExtractMs}ms`);

    // Step 4: Generate thumbnail
    console.log(`\n[Step 4/7] Generating thumbnail...`);
    let thumbnailResult: ThumbnailResult;
    let thumbnailMs: number;
    try {
      const measured = await measureTime(() =>
        generateAndUploadThumbnail(videoResult.filePath)
      );
      thumbnailResult = measured.result;
      thumbnailMs = measured.durationMs;
      console.log(`✓ Thumbnail generation complete in ${thumbnailMs}ms`);
    } catch (error) {
      console.error(
        `✗ Thumbnail generation failed:`,
        error instanceof Error ? error.message : error
      );
      // Use placeholder thumbnail
      thumbnailResult = {
        thumbnailUrl: "",
        publicId: "",
      };
      thumbnailMs = 0;
    }

    // Step 5: Transcribe audio
    console.log(`\n[Step 5/7] Transcribing audio...`);
    const { result: transcriptResult, durationMs: transcriptionMs } =
      await measureTime(() => transcribeAudioWithGemini(audioResult.audioPath));
    console.log(
      `✓ Transcription complete in ${transcriptionMs}ms (${transcriptResult.transcript.length} characters)`
    );

    // Step 6: Summarize transcript
    console.log(`\n[Step 6/7] Generating summary...`);
    const { result: summaryResult, durationMs: summarizationMs } =
      await measureTime(() => summarizeWithGroq(transcriptResult.transcript));
    console.log(`✓ Summarization complete in ${summarizationMs}ms`);

    // Step 7: Extract OCR text (non-critical)
    console.log(`\n[Step 7/7] Extracting OCR text...`);
    let ocrResult: OCRResult;
    let ocrMs: number;
    try {
      const measured = await measureTime(() =>
        extractTextFromImage(thumbnailResult.thumbnailUrl)
      );
      ocrResult = measured.result;
      ocrMs = measured.durationMs;
      console.log(
        `✓ OCR extraction complete in ${ocrMs}ms (${ocrResult.text.length} characters)`
      );
    } catch (error) {
      console.error(
        `✗ OCR extraction failed (non-critical):`,
        error instanceof Error ? error.message : error
      );
      ocrResult = { text: "" };
      ocrMs = 0;
    }

    const totalMs = Date.now() - startTime;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Reel Processor] Processing complete!`);
    console.log(`Total time: ${(totalMs / 1000).toFixed(2)}s`);
    console.log(`${"=".repeat(60)}\n`);

    return {
      sourceUrl: mediaResult.sourceUrl,
      videoUrl: mediaResult.videoUrl,
      thumbnailUrl: thumbnailResult.thumbnailUrl,
      transcript: transcriptResult.transcript,
      summary: summaryResult.summary,
      detailedExplanation: summaryResult.detailedExplanation,
      keyPoints: summaryResult.keyPoints,
      examples: summaryResult.examples,
      relatedTopics: summaryResult.relatedTopics,
      actionableChecklist: summaryResult.actionableChecklist,
      quizQuestions: summaryResult.quizQuestions,
      quickReferenceCard: summaryResult.quickReferenceCard,
      learningPath: summaryResult.learningPath,
      commonPitfalls: summaryResult.commonPitfalls,
      glossary: summaryResult.glossary,
      interactivePromptSuggestions: summaryResult.interactivePromptSuggestions,
      tags: summaryResult.tags,
      suggestedFolder: summaryResult.suggestedFolder,
      ocrText: ocrResult.text,
      metadata: {
        durationSeconds: audioResult.durationSeconds,
        title: mediaResult.title,
        description: mediaResult.description,
      },
      timings: {
        fetchMs,
        downloadMs,
        audioExtractMs,
        thumbnailMs,
        transcriptionMs,
        summarizationMs,
        ocrMs,
        totalMs,
      },
    };
  } catch (error) {
    console.error(`\n[Reel Processor] Processing failed:`, error);

    // Determine which step failed
    let step = "unknown";
    if (error instanceof Error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Instagram")
      ) {
        step = "fetch";
      } else if (error.message.includes("download")) {
        step = "download";
      } else if (error.message.includes("audio")) {
        step = "audio_extraction";
      } else if (error.message.includes("thumbnail")) {
        step = "thumbnail";
      } else if (error.message.includes("transcri")) {
        step = "transcription";
      } else if (error.message.includes("summar")) {
        step = "summarization";
      }
    }

    throw new ReelProcessingError(
      `Reel processing failed at step: ${step}`,
      step,
      error instanceof Error ? error : new Error(String(error))
    );
  } finally {
    // Clean up all temp files
    console.log(`\n[Cleanup] Removing temporary files...`);
    for (const filePath of tempFiles) {
      try {
        if (filePath.includes("/audio/")) {
          await deleteAudioFile(filePath);
        } else {
          await deleteFile(filePath);
        }
      } catch (error) {
        console.warn(`[Cleanup] Failed to delete ${filePath}:`, error);
      }
    }
    console.log(`[Cleanup] Cleanup complete\n`);
  }
}
