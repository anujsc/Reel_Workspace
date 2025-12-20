import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";

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
  // Log error stack in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error Stack:", err.stack);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";
  let errors: any[] = [];

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = "Validation error";
    errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate field value: ${field}`;
    errors = [
      {
        field,
        message: `${field} already exists`,
      },
    ];
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Not authorized - Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized - Token expired";
  }

  // Send error response
  const response: any = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
