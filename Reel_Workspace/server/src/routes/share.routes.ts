import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  objectIdValidation,
  validationHandler,
} from "../middleware/validation.js";
import {
  createFolderShare,
  getSharedFolder,
  deactivateFolderShare,
  getFolderShareStatus,
} from "../controllers/share.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * @route   POST /api/share/folder/:id
 * @desc    Create a shareable link for a folder
 * @access  Private
 */
router.post(
  "/folder/:id",
  protect,
  objectIdValidation,
  validationHandler,
  asyncHandler(createFolderShare)
);

/**
 * @route   GET /api/share/folder/:id/status
 * @desc    Get share status for a folder
 * @access  Private
 */
router.get(
  "/folder/:id/status",
  protect,
  objectIdValidation,
  validationHandler,
  asyncHandler(getFolderShareStatus)
);

/**
 * @route   DELETE /api/share/folder/:id
 * @desc    Deactivate folder share
 * @access  Private
 */
router.delete(
  "/folder/:id",
  protect,
  objectIdValidation,
  validationHandler,
  asyncHandler(deactivateFolderShare)
);

/**
 * @route   GET /api/share/:shareToken
 * @desc    Get shared folder and reels (public access)
 * @access  Public
 */
router.get("/:shareToken", asyncHandler(getSharedFolder));

export { router as shareRoutes };
