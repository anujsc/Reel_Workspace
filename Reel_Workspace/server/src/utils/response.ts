import { Response } from "express";

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  skip: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

/**
 * Success response interface
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
  timestamp: string;
}

/**
 * Error detail interface
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: ErrorDetail[];
  timestamp: string;
  path?: string;
  stack?: string;
}

/**
 * Create pagination metadata
 * @param total - Total number of items
 * @param limit - Items per page
 * @param skip - Number of items to skip
 */
export const createPaginationMeta = (
  total: number,
  limit: number,
  skip: number
): PaginationMeta => {
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    limit,
    skip,
    page,
    totalPages,
    hasMore: skip + limit < total,
    hasPrevious: skip > 0,
  };
};

/**
 * Standard success response format
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Response data
 * @param message - Optional success message
 * @param meta - Optional pagination metadata
 */
export const successResponse = <T = any>(
  res: Response,
  statusCode: number,
  data: T,
  message?: string,
  meta?: PaginationMeta
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param errors - Optional array of detailed errors
 * @param code - Optional error code
 */
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: ErrorDetail[],
  code?: string
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (code) {
    response.code = code;
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  // Include request path for debugging
  if (res.req) {
    response.path = res.req.originalUrl || res.req.url;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated success response
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Response data array
 * @param total - Total number of items
 * @param limit - Items per page
 * @param skip - Number of items to skip
 * @param message - Optional success message
 */
export const paginatedResponse = <T = any>(
  res: Response,
  statusCode: number,
  data: T[],
  total: number,
  limit: number,
  skip: number,
  message?: string
): Response => {
  const meta = createPaginationMeta(total, limit, skip);
  return successResponse(res, statusCode, data, message, meta);
};

/**
 * Created response (201)
 * @param res - Express response object
 * @param data - Created resource data
 * @param message - Optional success message
 */
export const createdResponse = <T = any>(
  res: Response,
  data: T,
  message: string = "Resource created successfully"
): Response => {
  return successResponse(res, 201, data, message);
};

/**
 * No content response (204)
 * @param res - Express response object
 */
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Bad request response (400)
 * @param res - Express response object
 * @param message - Error message
 * @param errors - Optional validation errors
 */
export const badRequestResponse = (
  res: Response,
  message: string = "Bad request",
  errors?: ErrorDetail[]
): Response => {
  return errorResponse(res, 400, message, errors, "BAD_REQUEST");
};

/**
 * Unauthorized response (401)
 * @param res - Express response object
 * @param message - Error message
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = "Unauthorized"
): Response => {
  return errorResponse(res, 401, message, undefined, "UNAUTHORIZED");
};

/**
 * Forbidden response (403)
 * @param res - Express response object
 * @param message - Error message
 */
export const forbiddenResponse = (
  res: Response,
  message: string = "Forbidden"
): Response => {
  return errorResponse(res, 403, message, undefined, "FORBIDDEN");
};

/**
 * Not found response (404)
 * @param res - Express response object
 * @param message - Error message
 */
export const notFoundResponse = (
  res: Response,
  message: string = "Resource not found"
): Response => {
  return errorResponse(res, 404, message, undefined, "NOT_FOUND");
};

/**
 * Conflict response (409)
 * @param res - Express response object
 * @param message - Error message
 */
export const conflictResponse = (
  res: Response,
  message: string = "Resource already exists"
): Response => {
  return errorResponse(res, 409, message, undefined, "CONFLICT");
};

/**
 * Internal server error response (500)
 * @param res - Express response object
 * @param message - Error message
 */
export const internalServerErrorResponse = (
  res: Response,
  message: string = "Internal server error"
): Response => {
  return errorResponse(res, 500, message, undefined, "INTERNAL_SERVER_ERROR");
};
