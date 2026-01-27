import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  reelExtractionValidation,
  reelUpdateValidation,
  paginationValidation,
  objectIdValidation,
  validationHandler,
} from "../middleware/validation.js";
import { filterQueryValidation } from "../middleware/searchValidation.js";
import {
  extractReel,
  getAllReels,
  getReelById,
  updateReel,
  deleteReel,
} from "../controllers/reel.controller.js";
import {
  filterReels,
  getFilterStats,
} from "../controllers/search.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { reelExtractionLimiter } from "../middleware/rateLimiter.js";

const router = Router();

/**
 * @route   POST /api/reel/extract
 * @desc    Extract and create a new reel from Instagram URL
 * @access  Private
 * @note    Rate limited to 1 request per minute to prevent memory spikes
 */
router.post(
  "/extract",
  reelExtractionLimiter, // CRITICAL: Prevent concurrent processing
  protect,
  reelExtractionValidation,
  validationHandler,
  asyncHandler(extractReel),
);

/**
 * @route   GET /api/reel/filter/stats
 * @desc    Get filter statistics (available tags, date range, folder counts)
 * @access  Private
 */
router.get("/filter/stats", protect, asyncHandler(getFilterStats));

/**
 * @route   GET /api/reel/filter
 * @desc    Advanced filter for reels (folder, tags, date range)
 * @access  Private
 */
router.get(
  "/filter",
  protect,
  filterQueryValidation,
  validationHandler,
  asyncHandler(filterReels),
);

/**
 * @route   GET /api/reel
 * @desc    Get all reels for authenticated user with pagination
 * @access  Private
 */
router.get(
  "/",
  protect,
  paginationValidation,
  validationHandler,
  asyncHandler(getAllReels),
);

/**
 * @route   GET /api/reel/:id
 * @desc    Get single reel by ID
 * @access  Private
 */
router.get(
  "/:id",
  protect,
  objectIdValidation,
  validationHandler,
  asyncHandler(getReelById),
);

/**
 * @route   PATCH /api/reel/:id
 * @desc    Update reel (title, folder, tags)
 * @access  Private
 */
router.patch(
  "/:id",
  protect,
  objectIdValidation,
  reelUpdateValidation,
  validationHandler,
  asyncHandler(updateReel),
);

/**
 * @route   DELETE /api/reel/:id
 * @desc    Delete reel (soft delete)
 * @access  Private
 */
router.delete(
  "/:id",
  protect,
  objectIdValidation,
  validationHandler,
  asyncHandler(deleteReel),
);

export { router as reelRoutes };
