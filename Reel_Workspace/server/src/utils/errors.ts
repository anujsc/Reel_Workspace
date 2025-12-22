/**
 * Custom error classes for application
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>;

  constructor(
    message: string = "Validation failed",
    fields?: Record<string, string>
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.fields = fields;
  }
}

/**
 * Authentication Error - 401
 * Used for authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

/**
 * Authorization Error - 403
 * Used for permission/access control failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

/**
 * Not Found Error - 404
 * Used when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND", 404);
  }
}

/**
 * Conflict Error - 409
 * Used for duplicate resources or conflicting operations
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, "CONFLICT", 409);
  }
}

/**
 * Rate Limit Error - 429
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
  }
}

/**
 * Internal Server Error - 500
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, "INTERNAL_SERVER_ERROR", 500, false);
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

/**
 * Database Error - 500
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, "DATABASE_ERROR", 500, false);
  }
}

/**
 * External Service Error - 502
 * Used when external API calls fail
 */
export class ExternalServiceError extends AppError {
  public readonly service?: string;

  constructor(
    message: string = "External service unavailable",
    service?: string
  ) {
    super(message, "EXTERNAL_SERVICE_ERROR", 502);
    this.service = service;
  }
}
