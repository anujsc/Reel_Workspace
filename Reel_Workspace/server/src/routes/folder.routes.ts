import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  folderCreationValidation,
  folderUpdateValidation,
  objectIdValidation,
  validationHandler,
} from "../middleware/validation.js";
import {
  createFolder,
  getAllFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
} from "../controllers/folder.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * @route   GET /api/folders
 * @desc    Get all folders for authenticated user
 * @access  Private
 */
router.get("/", protect, asyncHandler(getAllFolders));

/**
 * @route   POST /api/folders
 * @desc    Create a new folder
 * @access  Private
 */
router.post(
  "/",
  protect,
  folderCreationValidation,
  validationHandler,
  asyncHandler(createFolder)
);

/**
 * @route   GET /api/folders/:id
 * @desc    Get single folder by ID
 * @access  Private
 */
router.get(
  "/:id",
  protect,
  objectIdValidation,
  validationHandler,
  asyncHandler(getFolderById)
);

/**
 * @route   PATCH /api/folders/:id
 * @desc    Update folder (name, color)
 * @access  Private
 */
router.patch(
  "/:id",
  protect,
  objectIdValidation,
  folderUpdateValidation,
  validationHandler,
  asyncHandler(updateFolder)
);

/**
 * @route   DELETE /api/folders/:id
 * @desc    Delete folder
 * @access  Private
 */
router.delete(
  "/:id",
  protect,
  objectIdValidation,
  validationHandler,
  asyncHandler(deleteFolder)
);

export { router as folderRoutes };
