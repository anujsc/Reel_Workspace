import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response.js";

/**
 * Validate Instagram URL format
 */
export const validateInstagramUrl = (url: string): boolean => {
  const instagramRegex =
    /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/i;
  return instagramRegex.test(url);
};

/**
 * Validate hex color code
 */
export const validateHexColor = (color: string): boolean => {
  const hexColorRegex = /^#[0-9A-F]{6}$/i;
  return hexColorRegex.test(color);
};

/**
 * Middleware to validate reel extraction request
 */
export const validateReelExtraction = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { instagramUrl } = req.body;

  if (!instagramUrl) {
    errorResponse(res, 400, "Instagram URL is required");
    return;
  }

  if (typeof instagramUrl !== "string") {
    errorResponse(res, 400, "Instagram URL must be a string");
    return;
  }

  if (!validateInstagramUrl(instagramUrl)) {
    errorResponse(
      res,
      400,
      "Invalid Instagram URL format. Must be a valid Instagram post/reel URL"
    );
    return;
  }

  next();
};

/**
 * Middleware to validate reel update request
 */
export const validateReelUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, folderId, tags } = req.body;

  // At least one field must be provided
  if (!title && !folderId && !tags) {
    errorResponse(
      res,
      400,
      "At least one field (title, folderId, tags) must be provided"
    );
    return;
  }

  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== "string") {
      errorResponse(res, 400, "Title must be a string");
      return;
    }

    if (title.trim().length === 0) {
      errorResponse(res, 400, "Title cannot be empty");
      return;
    }

    if (title.length > 200) {
      errorResponse(res, 400, "Title cannot exceed 200 characters");
      return;
    }
  }

  // Validate folderId if provided
  if (folderId !== undefined) {
    if (typeof folderId !== "string") {
      errorResponse(res, 400, "Folder ID must be a string");
      return;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(folderId)) {
      errorResponse(res, 400, "Invalid folder ID format");
      return;
    }
  }

  // Validate tags if provided
  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      errorResponse(res, 400, "Tags must be an array");
      return;
    }

    if (tags.some((tag) => typeof tag !== "string")) {
      errorResponse(res, 400, "All tags must be strings");
      return;
    }

    if (tags.length > 20) {
      errorResponse(res, 400, "Cannot have more than 20 tags");
      return;
    }
  }

  next();
};

/**
 * Middleware to validate folder creation request
 */
export const validateFolderCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, color } = req.body;

  if (!name) {
    errorResponse(res, 400, "Folder name is required");
    return;
  }

  if (typeof name !== "string") {
    errorResponse(res, 400, "Folder name must be a string");
    return;
  }

  if (name.trim().length === 0) {
    errorResponse(res, 400, "Folder name cannot be empty");
    return;
  }

  if (name.length > 50) {
    errorResponse(res, 400, "Folder name cannot exceed 50 characters");
    return;
  }

  // Validate color if provided
  if (color !== undefined) {
    if (typeof color !== "string") {
      errorResponse(res, 400, "Color must be a string");
      return;
    }

    if (!validateHexColor(color)) {
      errorResponse(
        res,
        400,
        "Invalid color format. Must be a hex color code (e.g., #3B82F6)"
      );
      return;
    }
  }

  next();
};

/**
 * Middleware to validate folder update request
 */
export const validateFolderUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, color } = req.body;

  // At least one field must be provided
  if (!name && !color) {
    errorResponse(
      res,
      400,
      "At least one field (name, color) must be provided"
    );
    return;
  }

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== "string") {
      errorResponse(res, 400, "Folder name must be a string");
      return;
    }

    if (name.trim().length === 0) {
      errorResponse(res, 400, "Folder name cannot be empty");
      return;
    }

    if (name.length > 50) {
      errorResponse(res, 400, "Folder name cannot exceed 50 characters");
      return;
    }
  }

  // Validate color if provided
  if (color !== undefined) {
    if (typeof color !== "string") {
      errorResponse(res, 400, "Color must be a string");
      return;
    }

    if (!validateHexColor(color)) {
      errorResponse(
        res,
        400,
        "Invalid color format. Must be a hex color code (e.g., #3B82F6)"
      );
      return;
    }
  }

  next();
};

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { limit, skip } = req.query;

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errorResponse(res, 400, "Limit must be a number between 1 and 100");
      return;
    }
  }

  if (skip !== undefined) {
    const skipNum = Number(skip);
    if (isNaN(skipNum) || skipNum < 0) {
      errorResponse(res, 400, "Skip must be a non-negative number");
      return;
    }
  }

  next();
};
