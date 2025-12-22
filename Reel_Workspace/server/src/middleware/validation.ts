import { Request, Response, NextFunction } from "express";
import {
  body,
  param,
  query,
  validationResult,
  ValidationChain,
} from "express-validator";
import { errorResponse } from "../utils/response.js";
import mongoose from "mongoose";
import {
  INSTAGRAM_URL_REGEX,
  HEX_COLOR_REGEX,
  PASSWORD_STRENGTH_REGEX,
  isValidInstagramUrl,
  isValidHexColor,
  isValidObjectId,
  isValidEmail,
  sanitizeString,
} from "../utils/validators.js";

// ============================================================================
// AUTH VALIDATION RULES
// ============================================================================

/**
 * Validation rules for user registration
 */
export const registerValidation: ValidationChain[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email cannot exceed 255 characters"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .isLength({ max: 128 })
    .withMessage("Password cannot exceed 128 characters")
    .matches(PASSWORD_STRENGTH_REGEX)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

/**
 * Validation rules for user login
 */
export const loginValidation: ValidationChain[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password").trim().notEmpty().withMessage("Password is required"),
];

// ============================================================================
// REEL VALIDATION RULES
// ============================================================================

/**
 * Validation rules for reel extraction
 */
export const reelExtractionValidation: ValidationChain[] = [
  body("instagramUrl")
    .trim()
    .notEmpty()
    .withMessage("Instagram URL is required")
    .isString()
    .withMessage("Instagram URL must be a string")
    .matches(INSTAGRAM_URL_REGEX)
    .withMessage(
      "Invalid Instagram URL format. Must be a valid Instagram post/reel URL"
    ),
];

/**
 * Validation rules for reel update
 */
export const reelUpdateValidation: ValidationChain[] = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("folderId")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid folder ID format");
      }
      return true;
    }),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((tags: any[]) => {
      if (tags.length > 20) {
        throw new Error("Cannot have more than 20 tags");
      }
      if (tags.some((tag) => typeof tag !== "string")) {
        throw new Error("All tags must be strings");
      }
      if (tags.some((tag) => tag.trim().length === 0)) {
        throw new Error("Tags cannot be empty strings");
      }
      if (tags.some((tag) => tag.length > 50)) {
        throw new Error("Each tag cannot exceed 50 characters");
      }
      return true;
    }),
];

// ============================================================================
// FOLDER VALIDATION RULES
// ============================================================================

/**
 * Validation rules for folder creation
 */
export const folderCreationValidation: ValidationChain[] = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isString()
    .withMessage("Folder name must be a string")
    .isLength({ min: 1, max: 50 })
    .withMessage("Folder name must be between 1 and 50 characters"),

  body("color")
    .optional()
    .trim()
    .matches(HEX_COLOR_REGEX)
    .withMessage(
      "Invalid color format. Must be a hex color code (e.g., #3B82F6)"
    ),
];

/**
 * Validation rules for folder update
 */
export const folderUpdateValidation: ValidationChain[] = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Folder name cannot be empty")
    .isString()
    .withMessage("Folder name must be a string")
    .isLength({ min: 1, max: 50 })
    .withMessage("Folder name must be between 1 and 50 characters"),

  body("color")
    .optional()
    .trim()
    .matches(HEX_COLOR_REGEX)
    .withMessage(
      "Invalid color format. Must be a hex color code (e.g., #3B82F6)"
    ),
];

// ============================================================================
// SEARCH & FILTER VALIDATION RULES
// ============================================================================

/**
 * Validation rules for search query
 */
export const searchValidation: ValidationChain[] = [
  query("q")
    .optional()
    .trim()
    .isString()
    .withMessage("Search query must be a string")
    .isLength({ min: 1, max: 200 })
    .withMessage("Search query must be between 1 and 200 characters"),

  query("folderId")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid folder ID format");
      }
      return true;
    }),

  query("tags")
    .optional()
    .custom((value) => {
      // Handle both string and array formats
      if (typeof value === "string") {
        return true;
      }
      if (Array.isArray(value)) {
        if (value.some((tag) => typeof tag !== "string")) {
          throw new Error("All tags must be strings");
        }
        return true;
      }
      throw new Error("Tags must be a string or array of strings");
    }),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "title"])
    .withMessage("Sort by must be one of: createdAt, updatedAt, title"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either 'asc' or 'desc'"),
];

// ============================================================================
// PAGINATION VALIDATION RULES
// ============================================================================

/**
 * Validation rules for pagination parameters
 */
export const paginationValidation: ValidationChain[] = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be a number between 1 and 100")
    .toInt(),

  query("skip")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Skip must be a non-negative number")
    .toInt(),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive number")
    .toInt(),
];

// ============================================================================
// OBJECTID VALIDATION RULES
// ============================================================================

/**
 * Validation rule for MongoDB ObjectId in route parameters
 */
export const validateObjectId = (paramName: string = "id"): ValidationChain => {
  return param(paramName)
    .trim()
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${paramName} format`);
      }
      return true;
    });
};

/**
 * Common ObjectId validation for 'id' parameter
 */
export const objectIdValidation: ValidationChain[] = [validateObjectId("id")];

/**
 * ObjectId validation for 'reelId' parameter
 */
export const reelIdValidation: ValidationChain[] = [validateObjectId("reelId")];

/**
 * ObjectId validation for 'folderId' parameter
 */
export const folderIdValidation: ValidationChain[] = [
  validateObjectId("folderId"),
];

// ============================================================================
// VALIDATION HANDLER MIDDLEWARE
// ============================================================================

/**
 * Middleware to handle validation results
 * Returns 400 error if validation fails
 */
export const validationHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === "field" ? (err as any).path : "unknown",
      message: err.msg,
      code: "VALIDATION_ERROR",
    }));

    errorResponse(
      res,
      400,
      "Validation failed",
      errorMessages,
      "VALIDATION_ERROR"
    );
    return;
  }

  next();
};

// ============================================================================
// CUSTOM VALIDATION UTILITIES (Re-exported from validators.ts)
// ============================================================================

export {
  isValidInstagramUrl,
  isValidHexColor,
  isValidObjectId,
  isValidEmail,
  sanitizeString,
} from "../utils/validators.js";
