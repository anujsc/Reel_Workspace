import { fetchInstagramMedia } from "./instagramFetcher.js";
import { downloadVideo, deleteFile } from "./videoDownloader.js";
import { extractAudioToMp3, deleteAudioFile } from "./audioExtractor.js";
import {
  generateAndUploadThumbnail,
  ThumbnailResult,
} from "./thumbnailService.js";
import { transcribeAudioWithGemini } from "./aiTranscript.js";
import { summarizeWithGroq } from "./aiSummary.js";
import { extractTextFromFrames } from "./aiOCR.js";
import { ReelProcessingError } from "../utils/errors.js";
import { extractFrames, determineFrameSampling } from "./frameExtractor.js";
import {
  extractEntities,
  deduplicateEntities,
  categorizeEntities,
  SignificantInfoType,
} from "./aiEntityExtraction.js";
import { mergeMultimodalContent } from "./multimodalMerger.js";
import {
  analyzeCaptionWithAI,
  captionToEntities,
  CaptionAnalysisResult,
} from "./captionAnalyzer.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Complete result from reel processing (V2 with multimodal)
 */
export interface ReelProcessingResultV2 {
  sourceUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
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
  learningPath: string[];
  commonPitfalls: Array<{
    pitfall: string;
    solution: string;
  }>;
  interactivePromptSuggestions: string[];
  tags: string[];
  suggestedFolder: string;
  ocrText: string;

  // NEW: Multimodal fields
  rawData: {
    audioTranscript: string;
    visualTexts: Array<{
      frameTimestamp: number;
      text: string;
      confidence: number;
    }>;
    instagramCaption?: string;
    instagramDescription?: string;
  };
  visualInsights: {
    toolsAndPlatforms?: any;
    websitesAndUrls?: any;
    brandsAndProducts?: any;
    listsAndSequences?: any;
    numbersAndMetrics?: any;
    pricesAndCosts?: any;
    recommendations?: any;
  };
  multimodalMetadata: {
    processingVersion: string;
    frameCount: number;
    ocrFrames: number[];
    hasVisualText: boolean;
    hasAudioTranscript: boolean;
    hasMetadata: boolean;
  };

  metadata?: {
    durationSeconds?: number;
    originalTitle?: string;
    description?: string;
  };
  timings?: {
    fetchMs: number;
    downloadMs: number;
    audioExtractMs: number;
    frameExtractionMs: number;
    thumbnailMs: number;
    transcriptionMs: number;
    ocrMs: number;
    captionMs: number;
    entityExtractionMs: number;
    summarizationMs: number;
    totalMs: number;
  };
}

/**
 * Measures the execution time of an async function
 */
async function measureTime<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;
  return { result, durationMs };
}

/**
 * Upload frame to Cloudinary temporarily for OCR
 */
async function uploadFrameToCloudinary(
  filePath: string,
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "reel-frames-temp",
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Master orchestrator for processing Instagram Reels (V2 - Multimodal)
 */
export async function processReelV2(
  instagramUrl: string,
): Promise<ReelProcessingResultV2> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `[Reel Processor V2] Starting multimodal processing for: ${instagramUrl}`,
  );
  console.log(`${"=".repeat(60)}\n`);

  // Log memory before processing
  const memBefore = process.memoryUsage();
  console.log(
    `[Memory] Before processing: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memBefore.rss / 1024 / 1024)}MB RSS`,
  );

  const startTime = Date.now();
  const tempFiles: string[] = [];
  const cloudinaryPublicIds: string[] = [];

  try {
    // Step 1: Fetch Instagram media
    console.log(`\n[Step 1/10] Fetching Instagram media...`);
    const { result: mediaResult, durationMs: fetchMs } = await measureTime(() =>
      fetchInstagramMedia(instagramUrl),
    );
    console.log(`✓ Fetch complete in ${fetchMs}ms`);

    // Step 2: Download video
    console.log(`\n[Step 2/10] Downloading video...`);
    const { result: videoResult, durationMs: downloadMs } = await measureTime(
      () => downloadVideo(mediaResult.videoUrl),
    );
    tempFiles.push(videoResult.filePath);
    console.log(
      `✓ Download complete in ${downloadMs}ms (${(
        videoResult.sizeBytes /
        1024 /
        1024
      ).toFixed(2)}MB)`,
    );

    // Step 3: Extract audio
    console.log(`\n[Step 3/10] Extracting audio...`);
    const { result: audioResult, durationMs: audioExtractMs } =
      await measureTime(() => extractAudioToMp3(videoResult.filePath));
    tempFiles.push(audioResult.audioPath);
    console.log(`✓ Audio extraction complete in ${audioExtractMs}ms`);

    // Step 4: Extract multiple frames
    const durationSeconds = audioResult.durationSeconds || 30;
    const frameTimestamps = determineFrameSampling(durationSeconds);

    console.log(`\n[Step 4/10] Extracting ${frameTimestamps.length} frames...`);
    const { result: frameResult, durationMs: frameExtractionMs } =
      await measureTime(() =>
        extractFrames(videoResult.filePath, frameTimestamps),
      );
    console.log(`✓ Frame extraction complete in ${frameExtractionMs}ms`);

    // Step 5: Generate thumbnail (for UI)
    console.log(`\n[Step 5/10] Generating thumbnail...`);
    let thumbnailResult: ThumbnailResult;
    let thumbnailMs: number;
    try {
      const measured = await measureTime(() =>
        generateAndUploadThumbnail(videoResult.filePath),
      );
      thumbnailResult = measured.result;
      thumbnailMs = measured.durationMs;
      console.log(`✓ Thumbnail generation complete in ${thumbnailMs}ms`);
    } catch (error) {
      console.error(
        `✗ Thumbnail generation failed:`,
        error instanceof Error ? error.message : error,
      );
      thumbnailResult = { thumbnailUrl: "", publicId: "" };
      thumbnailMs = 0;
    }

    // Step 6: Transcribe audio
    console.log(`\n[Step 6/10] Transcribing audio...`);
    const { result: transcriptResult, durationMs: transcriptionMs } =
      await measureTime(() => transcribeAudioWithGemini(audioResult.audioPath));
    console.log(
      `✓ Transcription complete in ${transcriptionMs}ms (${transcriptResult.transcript.length} characters)`,
    );

    // Step 7: OCR all frames (OPTIMIZED: Parallel upload and batch OCR)
    console.log(
      `\n[Step 7/10] Extracting text from ${frameResult.frames.length} frames (optimized)...`,
    );
    let visualTexts: Array<{
      frameTimestamp: number;
      text: string;
      confidence: number;
    }> = [];
    let ocrMs = 0;

    try {
      const ocrStartTime = Date.now();

      // Upload frames to Cloudinary in parallel (faster than sequential)
      console.log(
        `[OCR] Uploading ${frameResult.frames.length} frames to Cloudinary...`,
      );
      const frameUploads = await Promise.all(
        frameResult.frames.map(async (frame) => {
          try {
            const upload = await uploadFrameToCloudinary(frame.filePath);
            cloudinaryPublicIds.push(upload.publicId);
            return {
              timestamp: frame.timestamp,
              imageUrl: upload.url,
            };
          } catch (error) {
            console.warn(
              `[OCR] Failed to upload frame at ${frame.timestamp}s, skipping...`,
            );
            return null;
          }
        }),
      );

      // Filter out failed uploads
      const validFrameUploads = frameUploads.filter(
        (f): f is { timestamp: number; imageUrl: string } => f !== null,
      );
      console.log(
        `[OCR] Successfully uploaded ${validFrameUploads.length}/${frameResult.frames.length} frames`,
      );

      if (validFrameUploads.length > 0) {
        // Process OCR with batch control
        const ocrResult = await extractTextFromFrames(validFrameUploads);

        // Map timestamp to frameTimestamp and filter out empty text
        visualTexts = ocrResult
          .map((item) => ({
            frameTimestamp: item.timestamp,
            text: item.text,
            confidence: item.confidence,
          }))
          .filter((item) => item.text && item.text.trim().length > 0);
      }

      ocrMs = Date.now() - ocrStartTime;

      const successfulOcr = visualTexts.length;
      console.log(
        `✓ OCR complete in ${ocrMs}ms (${successfulOcr}/${frameResult.frames.length} frames with text)`,
      );
    } catch (error) {
      console.error(
        `✗ OCR extraction failed (non-critical):`,
        error instanceof Error ? error.message : error,
      );
    }

    // Step 8: Analyze Instagram caption
    console.log(`\n[Step 8/11] Analyzing Instagram caption...`);
    let captionAnalysis: CaptionAnalysisResult | null = null;
    let captionMs = 0;

    if (mediaResult.description && mediaResult.description.trim().length > 0) {
      try {
        const { result: captionResult, durationMs: captionDuration } =
          await measureTime(() =>
            analyzeCaptionWithAI(mediaResult.description!),
          );

        captionAnalysis = captionResult;
        captionMs = captionDuration;

        console.log(
          `✓ Caption analysis complete in ${captionMs}ms (${captionAnalysis.keyPoints.length} key points, ${captionAnalysis.hashtags.length} hashtags)`,
        );
      } catch (error) {
        console.error(
          `✗ Caption analysis failed (non-critical):`,
          error instanceof Error ? error.message : error,
        );
      }
    } else {
      console.log(`⊘ No caption to analyze`);
    }

    // Step 9: Merge multimodal content
    console.log(`\n[Step 9/11] Merging multimodal content...`);
    // Convert frameTimestamp back to timestamp for merger
    const visualTextsForMerger = visualTexts.map((item) => ({
      timestamp: item.frameTimestamp,
      text: item.text,
      confidence: item.confidence,
    }));
    const mergedContent = mergeMultimodalContent(
      transcriptResult.transcript,
      visualTextsForMerger,
      {
        caption: mediaResult.description,
        description: mediaResult.description,
      },
    );

    // Step 10: Extract entities from all sources
    console.log(`\n[Step 10/11] Extracting entities...`);
    let entityExtractionMs = 0;
    let allEntities: any[] = [];

    try {
      const { result: entityResults, durationMs: entityDuration } =
        await measureTime(async () => {
          // Extract from visual text
          const visualEntities = await Promise.all(
            visualTexts
              .filter((v) => v.text.length > 0)
              .map((v) => extractEntities(v.text, "visual", v.frameTimestamp)),
          );

          // Extract from caption if available
          const captionEntities =
            captionAnalysis && captionAnalysis.hasImportantInfo
              ? captionToEntities(captionAnalysis)
              : [];

          // Combine all entities
          const allExtracted = [
            ...visualEntities.flatMap((r) => r.entities),
            ...captionEntities,
          ];

          return allExtracted;
        });

      allEntities = deduplicateEntities(entityResults);
      entityExtractionMs = entityDuration;

      console.log(
        `✓ Entity extraction complete in ${entityExtractionMs}ms (${allEntities.length} unique entities)`,
      );
    } catch (error) {
      console.error(
        `✗ Entity extraction failed (non-critical):`,
        error instanceof Error ? error.message : error,
      );
    }

    // Step 11: Generate AI summary with multimodal context
    console.log(`\n[Step 11/11] Generating multimodal summary...`);
    const { result: summaryResult, durationMs: summarizationMs } =
      await measureTime(() => summarizeWithGroq(mergedContent.mergedText));
    console.log(`✓ Summarization complete in ${summarizationMs}ms`);

    // Categorize entities by type
    const categorized = categorizeEntities(allEntities);

    const visualInsights = {
      toolsAndPlatforms: categorized[SignificantInfoType.TOOLS_PLATFORMS]
        ? {
            type: SignificantInfoType.TOOLS_PLATFORMS,
            category: "Tools & Platforms",
            items: categorized[SignificantInfoType.TOOLS_PLATFORMS].map(
              (e) => ({
                value: e.value,
                context: e.context,
              }),
            ),
            sourceFrames: categorized[SignificantInfoType.TOOLS_PLATFORMS]
              .map((e) => e.timestamp)
              .filter((t): t is number => t !== undefined),
            confidence: 0.85,
          }
        : undefined,
      websitesAndUrls: categorized[SignificantInfoType.WEBSITES_URLS]
        ? {
            type: SignificantInfoType.WEBSITES_URLS,
            category: "Websites & URLs",
            items: categorized[SignificantInfoType.WEBSITES_URLS].map((e) => ({
              value: e.value,
              context: e.context,
              metadata: { url: e.value },
            })),
            sourceFrames: categorized[SignificantInfoType.WEBSITES_URLS]
              .map((e) => e.timestamp)
              .filter((t): t is number => t !== undefined),
            confidence: 0.85,
          }
        : undefined,
      listsAndSequences: categorized[SignificantInfoType.LISTS_SEQUENCES]
        ? {
            type: SignificantInfoType.LISTS_SEQUENCES,
            category: "Lists & Sequences",
            items: categorized[SignificantInfoType.LISTS_SEQUENCES].map(
              (e) => ({
                value: e.value,
                context: e.context,
              }),
            ),
            sourceFrames: categorized[SignificantInfoType.LISTS_SEQUENCES]
              .map((e) => e.timestamp)
              .filter((t): t is number => t !== undefined),
            confidence: 0.85,
          }
        : undefined,
      numbersAndMetrics: categorized[SignificantInfoType.NUMBERS_METRICS]
        ? {
            type: SignificantInfoType.NUMBERS_METRICS,
            category: "Numbers & Metrics",
            items: categorized[SignificantInfoType.NUMBERS_METRICS].map(
              (e) => ({
                value: e.value,
                context: e.context,
              }),
            ),
            sourceFrames: categorized[SignificantInfoType.NUMBERS_METRICS]
              .map((e) => e.timestamp)
              .filter((t): t is number => t !== undefined),
            confidence: 0.85,
          }
        : undefined,
      pricesAndCosts: categorized[SignificantInfoType.PRICES_COSTS]
        ? {
            type: SignificantInfoType.PRICES_COSTS,
            category: "Prices & Costs",
            items: categorized[SignificantInfoType.PRICES_COSTS].map((e) => ({
              value: e.value,
              context: e.context,
              metadata: { price: e.value },
            })),
            sourceFrames: categorized[SignificantInfoType.PRICES_COSTS]
              .map((e) => e.timestamp)
              .filter((t): t is number => t !== undefined),
            confidence: 0.85,
          }
        : undefined,
      recommendations: categorized[SignificantInfoType.RECOMMENDATIONS]
        ? {
            type: SignificantInfoType.RECOMMENDATIONS,
            category: "Recommendations",
            items: categorized[SignificantInfoType.RECOMMENDATIONS].map(
              (e) => ({
                value: e.value,
                context: e.context,
              }),
            ),
            sourceFrames: categorized[SignificantInfoType.RECOMMENDATIONS]
              .map((e) => e.timestamp)
              .filter((t): t is number => t !== undefined),
            confidence: 0.85,
          }
        : undefined,
    };

    const totalMs = Date.now() - startTime;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Reel Processor V2] Processing complete!`);
    console.log(`Total time: ${(totalMs / 1000).toFixed(2)}s`);
    console.log(`Visual insights: ${allEntities.length} entities extracted`);
    if (captionAnalysis && captionAnalysis.hasImportantInfo) {
      console.log(
        `Caption insights: ${captionAnalysis.keyPoints.length} key points, ${captionAnalysis.hashtags.length} hashtags, ${captionAnalysis.urls.length} URLs`,
      );
    }
    console.log(`${"=".repeat(60)}\n`);

    return {
      sourceUrl: mediaResult.sourceUrl,
      videoUrl: mediaResult.videoUrl,
      thumbnailUrl: thumbnailResult.thumbnailUrl,
      title: summaryResult.title,
      transcript: transcriptResult.transcript,
      summary: summaryResult.summary,
      detailedExplanation: summaryResult.detailedExplanation,
      keyPoints: summaryResult.keyPoints,
      examples: summaryResult.examples,
      relatedTopics: summaryResult.relatedTopics,
      actionableChecklist: summaryResult.actionableChecklist,
      quizQuestions: summaryResult.quizQuestions,
      learningPath: summaryResult.learningPath,
      commonPitfalls: summaryResult.commonPitfalls,
      interactivePromptSuggestions: summaryResult.interactivePromptSuggestions,
      tags: summaryResult.tags,
      suggestedFolder: summaryResult.suggestedFolder,
      ocrText: visualTexts.map((v) => v.text).join("\n\n"),

      // NEW: Multimodal fields
      rawData: {
        audioTranscript: transcriptResult.transcript,
        visualTexts: visualTexts,
        instagramCaption: mediaResult.description,
        instagramDescription: mediaResult.description,
      },
      visualInsights,
      multimodalMetadata: {
        processingVersion: "v2.0",
        frameCount: frameResult.frames.length,
        ocrFrames: frameTimestamps,
        hasVisualText: visualTexts.some((v) => v.text.length > 0),
        hasAudioTranscript: transcriptResult.transcript.length > 0,
        hasMetadata: !!mediaResult.description,
      },

      metadata: {
        durationSeconds: audioResult.durationSeconds,
        originalTitle: mediaResult.title,
        description: mediaResult.description,
      },
      timings: {
        fetchMs,
        downloadMs,
        audioExtractMs,
        frameExtractionMs,
        thumbnailMs,
        transcriptionMs,
        ocrMs,
        captionMs,
        entityExtractionMs,
        summarizationMs,
        totalMs,
      },
    };
  } catch (error) {
    console.error(`\n[Reel Processor V2] Processing failed:`, error);

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
      } else if (error.message.includes("frame")) {
        step = "frame_extraction";
      } else if (error.message.includes("thumbnail")) {
        step = "thumbnail";
      } else if (error.message.includes("transcri")) {
        step = "transcription";
      } else if (error.message.includes("ocr")) {
        step = "ocr";
      } else if (error.message.includes("entity")) {
        step = "entity_extraction";
      } else if (error.message.includes("summar")) {
        step = "summarization";
      }
    }

    throw new ReelProcessingError(
      `Reel processing V2 failed at step: ${step}`,
      step,
      error instanceof Error ? error : new Error(String(error)),
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

    // Clean up Cloudinary temp uploads
    for (const publicId of cloudinaryPublicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.warn(
          `[Cleanup] Failed to delete Cloudinary image ${publicId}:`,
          error,
        );
      }
    }

    console.log(`[Cleanup] Cleanup complete\n`);

    // Force garbage collection if available (requires --expose-gc flag)
    if (global.gc) {
      console.log(`[Memory] Running garbage collection...`);
      global.gc();
      const memAfter = process.memoryUsage();
      console.log(
        `[Memory] After GC: ${Math.round(memAfter.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memAfter.rss / 1024 / 1024)}MB RSS`,
      );
    } else {
      const memAfter = process.memoryUsage();
      console.log(
        `[Memory] After processing: ${Math.round(memAfter.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memAfter.rss / 1024 / 1024)}MB RSS`,
      );
    }
  }
}
