import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { AppError } from "../utils/errors.js";
import { ErrorDetail, ErrorResponse } from "../utils/response.js";

/**
 * Error logger utility
 * Logs errors with appropriate level based on error type
 */
const logError = (err: any, req: Request): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userId = (req as any).user?.id || "anonymous";
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.get("user-agent") || "unknown";

  // Determine if error is operational or programming error
  const isOperational = err.isOperational !== false;

  // Base log object
  const logData = {
    timestamp,
    method,
    url,
    userId,
    ip,
    userAgent,
    name: err.name,
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
  };

  if (isOperational) {
    // Operational errors - log as warnings (expected errors)
    console.warn(`[${timestamp}] ⚠️  OPERATIONAL ERROR:`, {
      ...logData,
      type: "operational",
    });
  } else {
    // Programming errors - log as errors with full stack (unexpected errors)
    console.error(`[${timestamp}] ❌ PROGRAMMING ERROR:`, {
      ...logData,
      type: "programming",
      stack: err.stack,
      // Include additional debugging info for programming errors
      body: process.env.NODE_ENV === "development" ? req.body : undefined,
      query: process.env.NODE_ENV === "development" ? req.query : undefined,
      params: process.env.NODE_ENV === "development" ? req.params : undefined,
    });

    // In production, you might want to send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(err);
    }
  }

  // Log validation errors separately for better tracking
  if (err.code === "VALIDATION_ERROR" && err.errors) {
    console.info(`[${timestamp}] 📋 VALIDATION DETAILS:`, {
      url,
      userId,
      validationErrors: err.errors,
    });
  }
};

/**
 * Handle Mongoose validation errors
 */
const handleMongooseValidationError = (
  err: MongooseError.ValidationError
): {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
  code: string;
} => {
  const errors: ErrorDetail[] = Object.values(err.errors).map((error: any) => ({
    field: error.path,
    message: error.message,
    code: error.kind,
  }));

  return {
    statusCode: 400,
    message: "Validation failed",
    errors,
    code: "VALIDATION_ERROR",
  };
};

/**
 * Handle MongoDB duplicate key errors
 */
const handleDuplicateKeyError = (
  err: any
): {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
  code: string;
} => {
  const field = Object.keys(err.keyPattern)[0];
  const value = err.keyValue[field];

  return {
    statusCode: 409,
    message: `Duplicate value for field: ${field}`,
    errors: [
      {
        field,
        message: `${field} '${value}' already exists`,
        code: "DUPLICATE_KEY",
      },
    ],
    code: "DUPLICATE_KEY_ERROR",
  };
};

/**
 * Handle Mongoose cast errors (invalid ObjectId)
 */
const handleCastError = (
  err: any
): {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
  code: string;
} => {
  return {
    statusCode: 400,
    message: "Invalid ID format",
    errors: [
      {
        field: err.path,
        message: `Invalid ${err.kind} for field ${err.path}`,
        code: "INVALID_FORMAT",
      },
    ],
    code: "CAST_ERROR",
  };
};

/**
 * Handle JWT errors
 */
const handleJWTError = (
  err: any
): { statusCode: number; message: string; code: string } => {
  if (err.name === "TokenExpiredError") {
    return {
      statusCode: 401,
      message: "Token has expired. Please login again",
      code: "TOKEN_EXPIRED",
    };
  }

  if (err.name === "JsonWebTokenError") {
    return {
      statusCode: 401,
      message: "Invalid token. Please login again",
      code: "INVALID_TOKEN",
    };
  }

  return {
    statusCode: 401,
    message: "Authentication failed",
    code: "AUTH_ERROR",
  };
};

/**
 * Handle express-validator errors
 */
const handleValidationArrayError = (
  errors: any[]
): {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
  code: string;
} => {
  const formattedErrors: ErrorDetail[] = errors.map((error) => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    code: "VALIDATION_ERROR",
  }));

  return {
    statusCode: 400,
    message: "Validation failed",
    errors: formattedErrors,
    code: "VALIDATION_ERROR",
  };
};

/**
 * Global error handler middleware
 * Handles different types of errors and returns consistent error responses
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent sending response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Log the error
  logError(err, req);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors: ErrorDetail[] | undefined;
  let code = err.code || "INTERNAL_SERVER_ERROR";

  // Handle specific error types
  if (err instanceof MongooseError.ValidationError) {
    const result = handleMongooseValidationError(err);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
    code = result.code;
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    const result = handleDuplicateKeyError(err);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
    code = result.code;
  } else if (err.name === "CastError") {
    // Mongoose cast error
    const result = handleCastError(err);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
    code = result.code;
  } else if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    // JWT errors
    const result = handleJWTError(err);
    statusCode = result.statusCode;
    message = result.message;
    code = result.code;
  } else if (Array.isArray(err.errors) && err.errors.length > 0) {
    // express-validator errors
    const result = handleValidationArrayError(err.errors);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
    code = result.code;
  } else if (err instanceof AppError) {
    // Custom application errors
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;

    // Handle specific AppError types with additional data
    if ((err as any).fields) {
      errors = Object.entries((err as any).fields).map(([field, msg]) => ({
        field,
        message: msg as string,
        code: "VALIDATION_ERROR",
      }));
    }

    if ((err as any).step) {
      errors = errors || [];
      errors.push({
        field: "step",
        message: (err as any).step,
        code: "PROCESSING_ERROR",
      });
    }

    if ((err as any).service) {
      errors = errors || [];
      errors.push({
        field: "service",
        message: (err as any).service,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  }

  // Sanitize error message in production (don't leak sensitive info)
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "An unexpected error occurred. Please try again later.";
  }

  // Build error response
  const response: ErrorResponse = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace in development mode only
  if (process.env.NODE_ENV === "development" && err.stack) {
    response.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(response);
};

/**
 * Handle 404 - Not Found errors
 * This should be placed after all routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ErrorResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
  };

  res.status(404).json(response);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
