import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response.js";

/**
 * Validate search query parameters
 */
export const validateSearch = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { q, limit, skip } = req.query;

  // Validate query parameter
  if (!q) {
    errorResponse(res, 400, "Search query parameter 'q' is required", [
      { field: "q", message: "Query parameter is required" },
    ]);
    return;
  }

  if (typeof q !== "string") {
    errorResponse(res, 400, "Search query must be a string", [
      { field: "q", message: "Must be a string" },
    ]);
    return;
  }

  if (q.trim().length < 2) {
    errorResponse(res, 400, "Search query must be at least 2 characters", [
      { field: "q", message: "Minimum 2 characters required" },
    ]);
    return;
  }

  if (q.length > 200) {
    errorResponse(res, 400, "Search query too long", [
      { field: "q", message: "Maximum 200 characters allowed" },
    ]);
    return;
  }

  // Validate pagination
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errorResponse(res, 400, "Limit must be a number between 1 and 100", [
        { field: "limit", message: "Must be between 1 and 100" },
      ]);
      return;
    }
  }

  if (skip !== undefined) {
    const skipNum = Number(skip);
    if (isNaN(skipNum) || skipNum < 0) {
      errorResponse(res, 400, "Skip must be a non-negative number", [
        { field: "skip", message: "Must be >= 0" },
      ]);
      return;
    }
  }

  next();
};

/**
 * Validate filter query parameters
 */
export const validateFilter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { folderId, tags, dateFrom, dateTo, limit, skip } = req.query;

  // At least one filter must be provided
  if (!folderId && !tags && !dateFrom && !dateTo) {
    errorResponse(res, 400, "At least one filter parameter must be provided", [
      {
        message: "Provide at least one of: folderId, tags, dateFrom, dateTo",
      },
    ]);
    return;
  }

  // Validate folderId format (basic check, detailed check in controller)
  if (folderId !== undefined) {
    if (typeof folderId !== "string") {
      errorResponse(res, 400, "Folder ID must be a string", [
        { field: "folderId", message: "Must be a string" },
      ]);
      return;
    }

    if (folderId.length !== 24) {
      errorResponse(res, 400, "Invalid folder ID format", [
        {
          field: "folderId",
          message: "Must be a valid ObjectId (24 characters)",
        },
      ]);
      return;
    }
  }

  // Validate tags format
  if (tags !== undefined) {
    if (typeof tags !== "string") {
      errorResponse(res, 400, "Tags must be a comma-separated string", [
        { field: "tags", message: "Must be a string" },
      ]);
      return;
    }

    const tagArray = tags.split(",").map((t) => t.trim());
    if (tagArray.length > 20) {
      errorResponse(res, 400, "Too many tags", [
        { field: "tags", message: "Maximum 20 tags allowed" },
      ]);
      return;
    }

    if (tagArray.some((tag) => tag.length > 50)) {
      errorResponse(res, 400, "Tag too long", [
        { field: "tags", message: "Each tag must be <= 50 characters" },
      ]);
      return;
    }
  }

  // Validate date format (basic check)
  if (dateFrom !== undefined) {
    if (typeof dateFrom !== "string") {
      errorResponse(res, 400, "dateFrom must be a string", [
        { field: "dateFrom", message: "Must be a string" },
      ]);
      return;
    }

    const date = new Date(dateFrom);
    if (isNaN(date.getTime())) {
      errorResponse(res, 400, "Invalid dateFrom format", [
        { field: "dateFrom", message: "Must be a valid ISO date (YYYY-MM-DD)" },
      ]);
      return;
    }
  }

  if (dateTo !== undefined) {
    if (typeof dateTo !== "string") {
      errorResponse(res, 400, "dateTo must be a string", [
        { field: "dateTo", message: "Must be a string" },
      ]);
      return;
    }

    const date = new Date(dateTo);
    if (isNaN(date.getTime())) {
      errorResponse(res, 400, "Invalid dateTo format", [
        { field: "dateTo", message: "Must be a valid ISO date (YYYY-MM-DD)" },
      ]);
      return;
    }
  }

  // Validate date range logic
  if (dateFrom && dateTo) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    if (from > to) {
      errorResponse(res, 400, "dateFrom must be before dateTo", [
        { field: "dateFrom", message: "Must be before dateTo" },
      ]);
      return;
    }

    // Check if range is too large (e.g., more than 5 years)
    const diffYears =
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (diffYears > 5) {
      errorResponse(res, 400, "Date range too large", [
        { message: "Maximum 5 years range allowed" },
      ]);
      return;
    }
  }

  // Validate pagination
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errorResponse(res, 400, "Limit must be a number between 1 and 100", [
        { field: "limit", message: "Must be between 1 and 100" },
      ]);
      return;
    }
  }

  if (skip !== undefined) {
    const skipNum = Number(skip);
    if (isNaN(skipNum) || skipNum < 0) {
      errorResponse(res, 400, "Skip must be a non-negative number", [
        { field: "skip", message: "Must be >= 0" },
      ]);
      return;
    }
  }

  next();
};
