import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  validateFolderCreation,
  validateFolderUpdate,
} from "../middleware/reelValidation.js";
import {
  createFolder,
  getAllFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
} from "../controllers/folder.controller.js";

const router = Router();

/**
 * @route   GET /api/folders
 * @desc    Get all folders for authenticated user
 * @access  Private
 */
router.get("/", protect, getAllFolders);

/**
 * @route   POST /api/folders
 * @desc    Create a new folder
 * @access  Private
 */
router.post("/", protect, validateFolderCreation, createFolder);

/**
 * @route   GET /api/folders/:id
 * @desc    Get single folder by ID
 * @access  Private
 */
router.get("/:id", protect, getFolderById);

/**
 * @route   PATCH /api/folders/:id
 * @desc    Update folder (name, color)
 * @access  Private
 */
router.patch("/:id", protect, validateFolderUpdate, updateFolder);

/**
 * @route   DELETE /api/folders/:id
 * @desc    Delete folder
 * @access  Private
 */
router.delete("/:id", protect, deleteFolder);

export { router as folderRoutes };
