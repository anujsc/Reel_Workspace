import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  validateSearch,
  validateFilter,
} from "../middleware/searchValidation.js";
import {
  searchReels,
  filterReels,
  getFilterStats,
} from "../controllers/search.controller.js";

const router = Router();

/**
 * @route   GET /api/search
 * @desc    Text search across reels (summary, transcript, OCR text)
 * @access  Private
 * @query   q - Search query (required, min 2 chars)
 * @query   limit - Results per page (optional, default 20, max 100)
 * @query   skip - Number of results to skip (optional, default 0)
 */
router.get("/", protect, validateSearch, searchReels);

/**
 * @route   GET /api/reel/filter
 * @desc    Advanced filter for reels (folder, tags, date range)
 * @access  Private
 * @query   folderId - Filter by folder ID (optional)
 * @query   tags - Comma-separated tags (optional)
 * @query   dateFrom - Start date ISO format (optional)
 * @query   dateTo - End date ISO format (optional)
 * @query   limit - Results per page (optional, default 20, max 100)
 * @query   skip - Number of results to skip (optional, default 0)
 */
router.get("/filter", protect, validateFilter, filterReels);

/**
 * @route   GET /api/reel/filter/stats
 * @desc    Get filter statistics (available tags, date range, folder counts)
 * @access  Private
 */
router.get("/filter/stats", protect, getFilterStats);

export { router as searchRoutes };
