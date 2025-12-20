import { Response } from "express";

/**
 * Standard success response format
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Response data
 * @param message - Optional success message
 */
export const successResponse = (
  res: Response,
  statusCode: number,
  data: any,
  message?: string
): Response => {
  const response: any = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param errors - Optional array of detailed errors
 */
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: any[]
): Response => {
  const response: any = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
