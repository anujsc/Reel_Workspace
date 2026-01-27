import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Folder } from "../models/Folder.js";
import { FolderShare } from "../models/FolderShare.js";
import { Reel } from "../models/Reel.js";
import { successResponse, createdResponse } from "../utils/response.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import mongoose from "mongoose";
import { nanoid } from "nanoid";

/**
 * Create a shareable link for a folder
 *
 * Generates a unique share token that allows public access to folder contents.
 * Optionally set expiration date for time-limited sharing.
 *
 * @route POST /api/share/folder/:id
 * @access Private
 * @param {AuthRequest} req - Express request with folder ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 201 response with share token and URL
 * @throws {ValidationError} If folder ID format is invalid
 * @throws {NotFoundError} If folder not found or doesn't belong to user
 */
export const createFolderShare = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;
  const { expiresInDays } = req.body;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid folder ID format");
  }

  // Find folder and verify ownership
  const folder = await Folder.findOne({
    _id: id,
    userId,
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }

  // Check if active share already exists
  let folderShare = await FolderShare.findOne({
    folderId: id,
    userId,
    isActive: true,
  });

  if (folderShare) {
    // Return existing share
    const baseUrl = process.env.CLIENT_URL || "http://localhost:8080";
    const shareUrl = `${baseUrl}/shared/${folderShare.shareToken}`;

    successResponse(
      res,
      200,
      {
        shareToken: folderShare.shareToken,
        shareUrl,
        expiresAt: folderShare.expiresAt,
        viewCount: folderShare.viewCount,
      },
      "Folder share already exists"
    );
    return;
  }

  // Generate unique share token
  const shareToken = nanoid(12);

  // Calculate expiration date if provided
  let expiresAt: Date | undefined;
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  // Create folder share
  folderShare = await FolderShare.create({
    folderId: id,
    userId,
    shareToken,
    expiresAt,
    isActive: true,
    viewCount: 0,
  });

  // Generate shareable URL
  const baseUrl = process.env.CLIENT_URL || "http://localhost:8080";
  const shareUrl = `${baseUrl}/shared/${shareToken}`;

  createdResponse(
    res,
    {
      shareToken,
      shareUrl,
      expiresAt: folderShare.expiresAt,
      viewCount: 0,
    },
    "Folder share created successfully"
  );
};

/**
 * Get shared folder details and reels (public access)
 *
 * Allows anyone with the share token to view folder contents.
 * Increments view count on each access. Validates expiration.
 *
 * @route GET /api/share/:shareToken
 * @access Public
 * @param {Request} req - Express request with share token in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with folder and reels
 * @throws {NotFoundError} If share token invalid or expired
 */
export const getSharedFolder = async (
  req: any,
  res: Response
): Promise<void> => {
  const { shareToken } = req.params;

  // Find active share
  const folderShare = await FolderShare.findOne({
    shareToken,
    isActive: true,
  })
  .populate("folderId")
  .lean();

  if (!folderShare) {
    throw new NotFoundError("Shared folder not found or link is inactive");
  }

  // Check expiration
  if (folderShare.expiresAt && folderShare.expiresAt < new Date()) {
    throw new NotFoundError("This share link has expired");
  }

  // Increment view count
  folderShare.viewCount += 1;
  await folderShare.save();

  // Get folder details
  const folder = folderShare.folderId as any;

  // Get all reels in folder
  const reels = await Reel.find({
    folderId: folder._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .select("title summary thumbnailUrl videoUrl sourceUrl tags createdAt")
    .lean();

  successResponse(
    res,
    200,
    {
      folder: {
        id: folder._id,
        name: folder.name,
        color: folder.color,
        reelCount: folder.reelCount,
      },
      reels,
      viewCount: folderShare.viewCount,
      expiresAt: folderShare.expiresAt,
    },
    "Shared folder retrieved successfully"
  );
};

/**
 * Deactivate a folder share
 *
 * Disables the share link, making it inaccessible.
 * Does not delete the share record for analytics.
 *
 * @route DELETE /api/share/folder/:id
 * @access Private
 * @param {AuthRequest} req - Express request with folder ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response
 * @throws {ValidationError} If folder ID format is invalid
 * @throws {NotFoundError} If share not found
 */
export const deactivateFolderShare = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid folder ID format");
  }

  // Find and deactivate share
  const folderShare = await FolderShare.findOneAndUpdate(
    {
      folderId: id,
      userId,
      isActive: true,
    },
    {
      $set: { isActive: false },
    },
    { new: true }
  );

  if (!folderShare) {
    throw new NotFoundError("Active folder share not found");
  }

  successResponse(
    res,
    200,
    {
      shareToken: folderShare.shareToken,
      isActive: false,
    },
    "Folder share deactivated successfully"
  );
};

/**
 * Get share status for a folder
 *
 * Returns current share information if exists.
 *
 * @route GET /api/share/folder/:id/status
 * @access Private
 * @param {AuthRequest} req - Express request with folder ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with share status
 */
export const getFolderShareStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid folder ID format");
  }

  // Find active share
  const folderShare = await FolderShare.findOne({
    folderId: id,
    userId,
    isActive: true,
  });

  if (!folderShare) {
    successResponse(
      res,
      200,
      {
        isShared: false,
      },
      "Folder is not shared"
    );
    return;
  }

  const baseUrl = process.env.CLIENT_URL || "http://localhost:8080";
  const shareUrl = `${baseUrl}/shared/${folderShare.shareToken}`;

  successResponse(
    res,
    200,
    {
      isShared: true,
      shareToken: folderShare.shareToken,
      shareUrl,
      expiresAt: folderShare.expiresAt,
      viewCount: folderShare.viewCount,
      createdAt: folderShare.createdAt,
    },
    "Folder share status retrieved"
  );
};
