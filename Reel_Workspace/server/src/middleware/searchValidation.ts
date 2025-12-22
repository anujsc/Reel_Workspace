import { query, ValidationChain } from "express-validator";
import mongoose from "mongoose";

/**
 * Enhanced search validation with express-validator
 * Provides comprehensive validation for search and filter operations
 */

// ============================================================================
// SEARCH VALIDATION
// ============================================================================

/**
 * Validation rules for search endpoint
 */
export const searchQueryValidation: ValidationChain[] = [
  query("q")
    .trim()
    .notEmpty()
    .withMessage("Search query parameter 'q' is required")
    .isString()
    .withMessage("Search query must be a string")
    .isLength({ min: 2, max: 200 })
    .withMessage("Search query must be between 2 and 200 characters"),

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
];

// ============================================================================
// FILTER VALIDATION
// ============================================================================

/**
 * Validation rules for filter endpoint
 */
export const filterQueryValidation: ValidationChain[] = [
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
    .trim()
    .custom((value) => {
      if (typeof value !== "string") {
        throw new Error("Tags must be a comma-separated string");
      }

      const tagArray = value.split(",").map((t) => t.trim());

      if (tagArray.length > 20) {
        throw new Error("Maximum 20 tags allowed");
      }

      if (tagArray.some((tag) => tag.length > 50)) {
        throw new Error("Each tag must be 50 characters or less");
      }

      return true;
    }),

  query("dateFrom")
    .optional()
    .trim()
    .isISO8601()
    .withMessage("dateFrom must be a valid ISO date (YYYY-MM-DD)")
    .toDate(),

  query("dateTo")
    .optional()
    .trim()
    .isISO8601()
    .withMessage("dateTo must be a valid ISO date (YYYY-MM-DD)")
    .toDate()
    .custom((dateTo, { req }) => {
      const dateFrom = req.query?.dateFrom;

      if (dateFrom && dateTo) {
        const from = new Date(dateFrom as string);
        const to = new Date(dateTo);

        if (from > to) {
          throw new Error("dateFrom must be before dateTo");
        }

        // Check if range is too large (more than 5 years)
        const diffYears =
          (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (diffYears > 5) {
          throw new Error("Date range cannot exceed 5 years");
        }
      }

      return true;
    }),

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

  // Custom validation to ensure at least one filter is provided
  query().custom((value, { req }) => {
    const { folderId, tags, dateFrom, dateTo } = req.query || {};

    if (!folderId && !tags && !dateFrom && !dateTo) {
      throw new Error(
        "At least one filter parameter must be provided (folderId, tags, dateFrom, or dateTo)"
      );
    }

    return true;
  }),
];

// ============================================================================
// ADVANCED SEARCH VALIDATION
// ============================================================================

/**
 * Validation rules for advanced search with sorting
 */
export const advancedSearchValidation: ValidationChain[] = [
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
        const tagArray = value.split(",").map((t) => t.trim());
        if (tagArray.length > 20) {
          throw new Error("Maximum 20 tags allowed");
        }
        return true;
      }

      if (Array.isArray(value)) {
        if (value.length > 20) {
          throw new Error("Maximum 20 tags allowed");
        }
        if (value.some((tag) => typeof tag !== "string")) {
          throw new Error("All tags must be strings");
        }
        return true;
      }

      throw new Error("Tags must be a string or array of strings");
    }),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "title", "relevance"])
    .withMessage(
      "Sort by must be one of: createdAt, updatedAt, title, relevance"
    ),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either 'asc' or 'desc'"),

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
