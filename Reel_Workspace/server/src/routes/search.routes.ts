import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  searchQueryValidation,
  filterQueryValidation,
} from "../middleware/searchValidation.js";
import { validationHandler } from "../middleware/validation.js";
import {
  searchReels,
  filterReels,
  getFilterStats,
} from "../controllers/search.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * @route   GET /api/search
 * @desc    Text search across reels (summary, transcript, OCR text)
 * @access  Private
 * @query   q - Search query (required, min 2 chars)
 * @query   limit - Results per page (optional, default 20, max 100)
 * @query   skip - Number of results to skip (optional, default 0)
 */
router.get(
  "/",
  protect,
  searchQueryValidation,
  validationHandler,
  asyncHandler(searchReels)
);

/**
 * @route   GET /api/search/filter
 * @desc    Advanced filter for reels (folder, tags, date range)
 * @access  Private
 * @query   folderId - Filter by folder ID (optional)
 * @query   tags - Comma-separated tags (optional)
 * @query   dateFrom - Start date ISO format (optional)
 * @query   dateTo - End date ISO format (optional)
 * @query   limit - Results per page (optional, default 20, max 100)
 * @query   skip - Number of results to skip (optional, default 0)
 */
router.get(
  "/filter",
  protect,
  filterQueryValidation,
  validationHandler,
  asyncHandler(filterReels)
);

/**
 * @route   GET /api/search/filter/stats
 * @desc    Get filter statistics (available tags, date range, folder counts)
 * @access  Private
 */
router.get("/filter/stats", protect, asyncHandler(getFilterStats));

export { router as searchRoutes };
