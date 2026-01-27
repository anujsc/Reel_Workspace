import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Folder } from "../models/Folder.js";
import { Reel } from "../models/Reel.js";
import {
  successResponse,
  createdResponse,
  noContentResponse,
} from "../utils/response.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "../utils/errors.js";
import mongoose from "mongoose";

/**
 * Create a new folder for organizing reels
 *
 * Creates a folder with unique name per user. Folder names are case-sensitive
 * and must be 1-50 characters. Color defaults to blue if not provided.
 *
 * @route POST /api/folders
 * @access Private
 * @param {AuthRequest} req - Express request with name and color in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 201 response with created folder
 * @throws {ConflictError} If folder name already exists for user
 * @throws {ValidationError} If name or color format is invalid
 */
export const createFolder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { name, color } = req.body;
  const userId = req.user!._id;

  // Check for duplicate folder name
  const existingFolder = await Folder.findOne({
    userId,
    name: name.trim(),
  });

  if (existingFolder) {
    throw new ConflictError("A folder with this name already exists");
  }

  // Create folder
  const folder = await Folder.create({
    userId,
    name: name.trim(),
    color: color || "#3B82F6",
    reelCount: 0,
  });

  createdResponse(res, folder, "Folder created successfully");
};

/**
 * Get all folders for authenticated user
 *
 * Returns all folders sorted alphabetically by name.
 * Includes reel count for each folder.
 *
 * @route GET /api/folders
 * @access Private
 * @param {AuthRequest} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with folders array and total count
 */
export const getAllFolders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user!._id;

  // Get all folders sorted alphabetically
  const folders = await Folder.find({ userId }).sort({ name: 1 }).lean();

  successResponse(
    res,
    200,
    {
      folders,
      total: folders.length,
    },
    "Folders retrieved successfully"
  );
};

/**
 * Get single folder by ID
 * GET /api/folders/:id
 */
export const getFolderById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid folder ID format");
  }

  // Find folder
  const folder = await Folder.findOne({
    _id: id,
    userId,
  }).lean();

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }

  successResponse(res, 200, folder, "Folder retrieved successfully");
};

/**
 * Update folder name or color
 *
 * Allows updating folder name and/or color. Default folders cannot be renamed.
 * New name must be unique per user.
 *
 * @route PATCH /api/folders/:id
 * @access Private
 * @param {AuthRequest} req - Express request with folder ID in params and updates in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with updated folder
 * @throws {ValidationError} If ID or data format is invalid
 * @throws {AuthorizationError} If attempting to rename default folder
 * @throws {NotFoundError} If folder not found
 * @throws {ConflictError} If new name already exists
 */
export const updateFolder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;
  const { name, color } = req.body;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid folder ID format");
  }

  // Find folder
  const folder = await Folder.findOne({
    _id: id,
    userId,
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }

  // Check if trying to rename default folder
  if (folder.isDefault && name !== undefined) {
    throw new AuthorizationError("Cannot rename default folder");
  }

  // Build update object
  const updateData: any = {};
  if (name !== undefined) {
    const trimmedName = name.trim();

    // Check for duplicate name
    const existingFolder = await Folder.findOne({
      userId,
      name: trimmedName,
      _id: { $ne: id },
    });

    if (existingFolder) {
      throw new ConflictError("A folder with this name already exists");
    }

    updateData.name = trimmedName;
  }

  if (color !== undefined) {
    updateData.color = color;
  }

  // Update folder
  const updatedFolder = await Folder.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  successResponse(res, 200, updatedFolder, "Folder updated successfully");
};

/**
 * Delete a folder
 *
 * Deletes folder with optional strategy for handling contained reels:
 * - prevent (default): Fails if folder contains reels
 * - move: Moves reels to "Uncategorized" folder before deletion
 *
 * Default folders cannot be deleted.
 *
 * @route DELETE /api/folders/:id?strategy=move
 * @access Private
 * @param {AuthRequest} req - Express request with folder ID in params and strategy in query
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 204 No Content response
 * @throws {ValidationError} If ID format is invalid
 * @throws {AuthorizationError} If attempting to delete default folder
 * @throws {NotFoundError} If folder not found
 * @throws {ConflictError} If folder contains reels and strategy is prevent
 */
export const deleteFolder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;
  const { strategy } = req.query; // 'move' or 'prevent' (default: prevent)

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid folder ID format");
  }

  // Find folder
  const folder = await Folder.findOne({
    _id: id,
    userId,
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }

  // Prevent deletion of default folder
  if (folder.isDefault) {
    throw new AuthorizationError("Cannot delete default folder");
  }

  // Check if folder contains reels
  if (folder.reelCount > 0) {
    if (strategy === "move") {
      // Find or create "Uncategorized" folder
      let uncategorizedFolder = await Folder.findOne({
        userId,
        name: "Uncategorized",
      });

      if (!uncategorizedFolder) {
        uncategorizedFolder = await Folder.create({
          userId,
          name: "Uncategorized",
          color: "#6B7280", // Gray
          reelCount: 0,
        });
      }

      // Move all reels to Uncategorized
      const updateResult = await Reel.updateMany(
        { folderId: id, userId, isDeleted: false },
        { $set: { folderId: uncategorizedFolder._id } }
      );

      // Update folder counts
      await Folder.findByIdAndUpdate(uncategorizedFolder._id, {
        $inc: { reelCount: folder.reelCount },
      });
    } else {
      // Prevent deletion
      throw new ConflictError(
        `Cannot delete folder containing ${folder.reelCount} reel(s). Move or delete reels first, or use ?strategy=move to auto-move them.`
      );
    }
  }

  // Delete folder
  await Folder.findByIdAndDelete(id);

  noContentResponse(res);
};
