import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Reel } from "../models/Reel.js";
import { Folder } from "../models/Folder.js";
import { processReelV2 } from "../services/reelProcessorV2.js";
import { processingQueue } from "../services/processingQueue.js";
import {
  successResponse,
  createdResponse,
  paginatedResponse,
  noContentResponse,
} from "../utils/response.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import mongoose from "mongoose";

/**
 * Extract and create a new reel from Instagram URL
 *
 * Orchestrates the complete reel extraction pipeline:
 * - Checks for duplicate URLs
 * - Downloads and processes video
 * - Generates AI transcript and summary
 * - Extracts OCR text from frames
 * - Auto-categorizes into folder
 * - Saves to database
 *
 * @route POST /api/reel/extract
 * @access Private
 * @param {AuthRequest} req - Express request with instagramUrl in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 201 response with reel data and processing timings
 * @throws {ConflictError} If reel URL already extracted by user
 * @throws {ReelProcessingError} If extraction pipeline fails
 */
export const extractReel = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { instagramUrl } = req.body;
  const userId = req.user!._id;

  console.log(
    `[Reel Controller] Starting extraction for user ${userId}, URL: ${instagramUrl}`,
  );

  try {
    // Check for duplicate URL
    const existingReel = await Reel.findOne({
      sourceUrl: instagramUrl,
      userId,
      isDeleted: false,
    })
      .select("_id")
      .lean();

    if (existingReel) {
      console.log(
        `[Reel Controller] Duplicate reel found for URL: ${instagramUrl}`,
      );
      throw new ConflictError("This reel has already been extracted");
    }

    console.log(`[Reel Controller] Processing reel...`);

    // Use processing queue to prevent concurrent processing (CRITICAL for 512MB RAM)
    const processingResult = await processingQueue.add(
      userId.toString(),
      instagramUrl,
      async () => await processReelV2(instagramUrl),
    );

    console.log(`[Reel Controller] ✓ Reel processed successfully`);

    // Find or create folder based on suggested category
    let folder = await Folder.findOne({
      userId,
      name: processingResult.suggestedFolder,
    });

    if (!folder) {
      console.log(
        `[Reel Controller] Creating new folder: ${processingResult.suggestedFolder}`,
      );
      // Create new folder with suggested name
      folder = await Folder.create({
        userId,
        name: processingResult.suggestedFolder,
        color: "#3B82F6", // Default blue
        reelCount: 0,
      });
    }

    console.log(`[Reel Controller] Saving reel to database...`);
    // Create reel document with V2 multimodal fields
    const reel = await Reel.create({
      userId,
      folderId: folder._id,
      sourceUrl: processingResult.sourceUrl,
      videoUrl: processingResult.videoUrl,
      thumbnailUrl: processingResult.thumbnailUrl,
      title: processingResult.title, // AI-generated descriptive title
      transcript: processingResult.transcript,
      summary: processingResult.summary,
      detailedExplanation: processingResult.detailedExplanation,
      keyPoints: processingResult.keyPoints,
      examples: processingResult.examples,
      relatedTopics: processingResult.relatedTopics,
      actionableChecklist: processingResult.actionableChecklist,
      quizQuestions: processingResult.quizQuestions,
      learningPath: processingResult.learningPath,
      commonPitfalls: processingResult.commonPitfalls,
      interactivePromptSuggestions:
        processingResult.interactivePromptSuggestions,
      tags: processingResult.tags,
      ocrText: processingResult.ocrText,
      durationSeconds: processingResult.metadata?.durationSeconds,

      // NEW: V2 multimodal fields
      rawData: (processingResult as any).rawData,
      visualInsights: (processingResult as any).visualInsights,
      multimodalMetadata: (processingResult as any).multimodalMetadata,
    });

    // Increment folder reel count
    await Folder.findByIdAndUpdate(folder._id, {
      $inc: { reelCount: 1 },
    });

    console.log(
      `[Reel Controller] ✓ Reel extraction complete, ID: ${reel._id}`,
    );

    createdResponse(
      res,
      {
        reel,
        timings: processingResult.timings,
      },
      "Reel extracted successfully",
    );
  } catch (error) {
    console.error(`[Reel Controller] ❌ Extraction failed:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      url: instagramUrl,
      userId,
    });
    throw error;
  }
};

/**
 * Get all reels for authenticated user with pagination
 *
 * Supports optional filtering by folder and pagination parameters.
 * Results are sorted by creation date (newest first).
 *
 * @route GET /api/reel?limit=10&skip=0&folderId=xxx
 * @access Private
 * @param {AuthRequest} req - Express request with query params (limit, skip, folderId)
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with paginated reel list
 * @throws {ValidationError} If folderId format is invalid
 */
export const getAllReels = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user!._id;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = parseInt(req.query.skip as string) || 0;
  const folderId = req.query.folderId as string;

  // Build query
  const query: any = {
    userId,
    isDeleted: false,
  };

  // Add folder filter if provided
  if (folderId) {
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      throw new ValidationError("Invalid folder ID format");
    }
    query.folderId = folderId;
  }

  // Get reels with pagination
  const reels = await Reel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("folderId", "name color")
    .select(
      "title summary thumbnailUrl tags folderId createdAt durationSeconds",
    ) // ← ADD THIS
    .lean();

  // Get total count for pagination
  const total = await Reel.countDocuments(query);

  paginatedResponse(
    res,
    200,
    reels,
    total,
    limit,
    skip,
    "Reels retrieved successfully",
  );
};

/**
 * Get single reel by ID with complete details
 *
 * Returns full reel data including transcript, summary, learning materials,
 * and populated folder information.
 *
 * @route GET /api/reel/:id
 * @access Private
 * @param {AuthRequest} req - Express request with reel ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with complete reel data
 * @throws {ValidationError} If ID format is invalid
 * @throws {NotFoundError} If reel not found or doesn't belong to user
 */
export const getReelById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid reel ID format");
  }

  // Find reel
  const reel = await Reel.findOne({
    _id: id,
    userId,
    isDeleted: false,
  })
    .populate("folderId", "name color")
    .lean();

  if (!reel) {
    throw new NotFoundError("Reel not found");
  }

  successResponse(res, 200, reel, "Reel retrieved successfully");
};

/**
 * Update reel metadata (title, folder, tags)
 *
 * Allows updating reel title, tags array, and moving to different folder.
 * When moving folders, automatically updates reel counts for both folders.
 *
 * @route PATCH /api/reel/:id
 * @access Private
 * @param {AuthRequest} req - Express request with reel ID in params and updates in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with updated reel data
 * @throws {ValidationError} If ID or data format is invalid
 * @throws {NotFoundError} If reel or target folder not found
 */
export const updateReel = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;
  const { title, folderId, tags } = req.body;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid reel ID format");
  }

  // Find reel (only need folderId for update)
  const reel = await Reel.findOne({
    _id: id,
    userId,
    isDeleted: false,
  })
    .select("folderId")
    .lean();

  if (!reel) {
    throw new NotFoundError("Reel not found");
  }

  const oldFolderId = reel.folderId;

  // Build update object
  const updateData: any = {};
  if (title !== undefined) updateData.title = title.trim();
  if (tags !== undefined)
    updateData.tags = tags.map((t: string) => t.toLowerCase().trim());

  // Handle folder change
  if (folderId !== undefined && folderId !== oldFolderId.toString()) {
    // Validate new folder exists and belongs to user
    const newFolder = await Folder.findOne({
      _id: folderId,
      userId,
    });

    if (!newFolder) {
      throw new NotFoundError("Target folder not found");
    }

    updateData.folderId = folderId;

    // Update folder counts
    await Promise.all([
      Folder.findByIdAndUpdate(oldFolderId, { $inc: { reelCount: -1 } }),
      Folder.findByIdAndUpdate(folderId, { $inc: { reelCount: 1 } }),
    ]);
  }

  // Update reel
  const updatedReel = await Reel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  )
    .populate("folderId", "name color")
    .select("title tags folderId createdAt updatedAt")
    .lean();

  successResponse(res, 200, updatedReel, "Reel updated successfully");
};

/**
 * Soft delete a reel
 *
 * Marks reel as deleted without removing from database.
 * Automatically decrements the folder's reel count.
 *
 * @route DELETE /api/reel/:id
 * @access Private
 * @param {AuthRequest} req - Express request with reel ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 204 No Content response
 * @throws {ValidationError} If ID format is invalid
 * @throws {NotFoundError} If reel not found or already deleted
 */
export const deleteReel = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid reel ID format");
  }

  // Find reel (only need folderId for deletion)
  const reel = await Reel.findOne({
    _id: id,
    userId,
    isDeleted: false,
  })
    .select("folderId")
    .lean();

  if (!reel) {
    throw new NotFoundError("Reel not found");
  }

  // Soft delete using updateOne (more efficient than loading full document)
  await Reel.updateOne({ _id: id }, { $set: { isDeleted: true } });

  // Decrement folder reel count
  await Folder.findByIdAndUpdate(reel.folderId, {
    $inc: { reelCount: -1 },
  });

  noContentResponse(res);
};
