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
 * Create a new folder
 * POST /api/folders
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

  console.log(`[Folder Controller] ✓ Folder created: ${folder.name}`);

  createdResponse(res, folder, "Folder created successfully");
};

/**
 * Get all folders for authenticated user
 * GET /api/folders
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
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }

  successResponse(res, 200, folder, "Folder retrieved successfully");
};

/**
 * Update folder (name, color)
 * PATCH /api/folders/:id
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

  console.log(`[Folder Controller] ✓ Folder updated: ${id}`);

  successResponse(res, 200, updatedFolder, "Folder updated successfully");
};

/**
 * Delete folder
 * DELETE /api/folders/:id
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

      console.log(
        `[Folder Controller] Moved ${updateResult.modifiedCount} reels to Uncategorized`
      );
    } else {
      // Prevent deletion
      throw new ConflictError(
        `Cannot delete folder containing ${folder.reelCount} reel(s). Move or delete reels first, or use ?strategy=move to auto-move them.`
      );
    }
  }

  // Delete folder
  await Folder.findByIdAndDelete(id);

  console.log(`[Folder Controller] ✓ Folder deleted: ${id}`);

  noContentResponse(res);
};
