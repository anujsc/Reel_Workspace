import { Request, Response } from "express";
import { processReel } from "../services/reelProcessor.js";
import {
  InvalidInstagramUrlError,
  MediaNotFoundError,
  PrivateMediaError,
  UnsupportedMediaError,
  VideoDownloadError,
  AudioExtractionError,
  TranscriptionError,
  SummarizationError,
  ReelProcessingError,
  AppError,
} from "../utils/errors.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Test endpoint to extract and process Instagram Reel
 * @route POST /api/test/extract-services
 */
export const testExtractServices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { url } = req.body;

    // Validate URL is present
    if (!url || typeof url !== "string") {
      errorResponse(res, 400, "URL is required in request body");
      return;
    }

    console.log(`\n[Test Controller] Processing URL: ${url}`);

    // Call the master orchestrator
    const result = await processReel(url);

    // Return successful result
    successResponse(res, 200, result, "Reel processed successfully");
  } catch (error) {
    console.error(`[Test Controller] Error:`, error);

    // Map known error types to appropriate HTTP status codes
    if (error instanceof InvalidInstagramUrlError) {
      errorResponse(res, 400, error.message);
      return;
    }

    if (error instanceof MediaNotFoundError) {
      errorResponse(res, 404, error.message);
      return;
    }

    if (error instanceof PrivateMediaError) {
      errorResponse(res, 403, error.message);
      return;
    }

    if (error instanceof UnsupportedMediaError) {
      errorResponse(res, 400, error.message);
      return;
    }

    if (error instanceof VideoDownloadError) {
      errorResponse(res, 500, `Video download failed: ${error.message}`);
      return;
    }

    if (error instanceof AudioExtractionError) {
      errorResponse(res, 500, `Audio extraction failed: ${error.message}`);
      return;
    }

    if (error instanceof TranscriptionError) {
      errorResponse(res, 500, `Transcription failed: ${error.message}`);
      return;
    }

    if (error instanceof SummarizationError) {
      errorResponse(res, 500, `Summarization failed: ${error.message}`);
      return;
    }

    if (error instanceof ReelProcessingError) {
      errorResponse(
        res,
        error.statusCode,
        error.message,
        error.step
          ? [{ step: error.step, error: error.rootCause?.message }]
          : undefined
      );
      return;
    }

    if (error instanceof AppError) {
      errorResponse(res, error.statusCode, error.message);
      return;
    }

    // Unknown error
    errorResponse(
      res,
      500,
      `An unexpected error occurred: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
