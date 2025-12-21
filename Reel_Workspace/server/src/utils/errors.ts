/**
 * Custom error classes for media processing pipeline
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Instagram Fetcher Errors
export class InvalidInstagramUrlError extends AppError {
  constructor(message: string = "Invalid Instagram URL format") {
    super(message, "INVALID_INSTAGRAM_URL", 400);
  }
}

export class MediaNotFoundError extends AppError {
  constructor(message: string = "Media not found or has been deleted") {
    super(message, "MEDIA_NOT_FOUND", 404);
  }
}

export class PrivateMediaError extends AppError {
  constructor(message: string = "Cannot access private media") {
    super(message, "PRIVATE_MEDIA", 403);
  }
}

export class UnsupportedMediaError extends AppError {
  constructor(message: string = "Unsupported media type") {
    super(message, "UNSUPPORTED_MEDIA", 400);
  }
}

// Video Download Errors
export class VideoDownloadError extends AppError {
  constructor(message: string = "Failed to download video") {
    super(message, "VIDEO_DOWNLOAD_ERROR", 500);
  }
}

export class FileSystemError extends AppError {
  constructor(message: string = "File system operation failed") {
    super(message, "FILE_SYSTEM_ERROR", 500);
  }
}

// Audio Extraction Errors
export class AudioExtractionError extends AppError {
  constructor(message: string = "Failed to extract audio from video") {
    super(message, "AUDIO_EXTRACTION_ERROR", 500);
  }
}

export class InvalidMediaError extends AppError {
  constructor(message: string = "Invalid or corrupted media file") {
    super(message, "INVALID_MEDIA", 400);
  }
}

// Thumbnail Errors
export class ThumbnailGenerationError extends AppError {
  constructor(message: string = "Failed to generate thumbnail") {
    super(message, "THUMBNAIL_GENERATION_ERROR", 500);
  }
}

export class CloudinaryUploadError extends AppError {
  constructor(message: string = "Failed to upload to Cloudinary") {
    super(message, "CLOUDINARY_UPLOAD_ERROR", 500);
  }
}

// AI Service Errors
export class TranscriptionError extends AppError {
  constructor(message: string = "Failed to transcribe audio") {
    super(message, "TRANSCRIPTION_ERROR", 500);
  }
}

export class SummarizationError extends AppError {
  constructor(message: string = "Failed to generate summary") {
    super(message, "SUMMARIZATION_ERROR", 500);
  }
}

export class OcrError extends AppError {
  constructor(message: string = "Failed to extract text from video") {
    super(message, "OCR_ERROR", 500);
  }
}

// Orchestration Error
export class ReelProcessingError extends AppError {
  public readonly step?: string;
  public readonly rootCause?: Error;

  constructor(
    message: string,
    step?: string,
    rootCause?: Error,
    statusCode: number = 500
  ) {
    super(message, "REEL_PROCESSING_ERROR", statusCode);
    this.step = step;
    this.rootCause = rootCause;
  }
}
