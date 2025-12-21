import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  validateReelExtraction,
  validateReelUpdate,
  validatePagination,
} from "../middleware/reelValidation.js";
import { validateFilter } from "../middleware/searchValidation.js";
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

const router = Router();

/**
 * @route   POST /api/reel/extract
 * @desc    Extract and create a new reel from Instagram URL
 * @access  Private
 */
router.post("/extract", protect, validateReelExtraction, extractReel);

/**
 * @route   GET /api/reel/filter/stats
 * @desc    Get filter statistics (available tags, date range, folder counts)
 * @access  Private
 */
router.get("/filter/stats", protect, getFilterStats);

/**
 * @route   GET /api/reel/filter
 * @desc    Advanced filter for reels (folder, tags, date range)
 * @access  Private
 */
router.get("/filter", protect, validateFilter, filterReels);

/**
 * @route   GET /api/reel
 * @desc    Get all reels for authenticated user with pagination
 * @access  Private
 */
router.get("/", protect, validatePagination, getAllReels);

/**
 * @route   GET /api/reel/:id
 * @desc    Get single reel by ID
 * @access  Private
 */
router.get("/:id", protect, getReelById);

/**
 * @route   PATCH /api/reel/:id
 * @desc    Update reel (title, folder, tags)
 * @access  Private
 */
router.patch("/:id", protect, validateReelUpdate, updateReel);

/**
 * @route   DELETE /api/reel/:id
 * @desc    Delete reel (soft delete)
 * @access  Private
 */
router.delete("/:id", protect, deleteReel);

export { router as reelRoutes };
