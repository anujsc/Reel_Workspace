import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Reel } from "../models/Reel.js";
import { Folder } from "../models/Folder.js";
import { processReel } from "../services/reelProcessor.js";
import { successResponse, errorResponse } from "../utils/response.js";
import mongoose from "mongoose";

/**
 * Extract and create a new reel from Instagram URL
 * POST /api/reel/extract
 */
export const extractReel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { instagramUrl } = req.body;
    const userId = req.user!._id;

    console.log(`[Reel Controller] Processing URL: ${instagramUrl}`);

    // Check for duplicate URL
    const existingReel = await Reel.findOne({
      sourceUrl: instagramUrl,
      userId,
      isDeleted: false,
    });

    if (existingReel) {
      errorResponse(res, 409, "This reel has already been extracted", [
        existingReel,
      ]);
      return;
    }

    // Process the reel using orchestrator
    const processingResult = await processReel(instagramUrl);

    // Find or create folder based on suggested category
    let folder = await Folder.findOne({
      userId,
      name: processingResult.suggestedFolder,
    });

    if (!folder) {
      // Create new folder with suggested name
      folder = await Folder.create({
        userId,
        name: processingResult.suggestedFolder,
        color: "#3B82F6", // Default blue
        reelCount: 0,
      });
      console.log(`[Reel Controller] Created new folder: ${folder.name}`);
    }

    // Create reel document
    const reel = await Reel.create({
      userId,
      folderId: folder._id,
      sourceUrl: processingResult.sourceUrl,
      videoUrl: processingResult.videoUrl,
      thumbnailUrl: processingResult.thumbnailUrl,
      title: processingResult.metadata?.title || "Untitled Reel",
      transcript: processingResult.transcript,
      summary: processingResult.summary,
      detailedExplanation: processingResult.detailedExplanation,
      keyPoints: processingResult.keyPoints,
      examples: processingResult.examples,
      relatedTopics: processingResult.relatedTopics,
      actionableChecklist: processingResult.actionableChecklist,
      quizQuestions: processingResult.quizQuestions,
      quickReferenceCard: processingResult.quickReferenceCard,
      learningPath: processingResult.learningPath,
      commonPitfalls: processingResult.commonPitfalls,
      glossary: processingResult.glossary,
      interactivePromptSuggestions:
        processingResult.interactivePromptSuggestions,
      tags: processingResult.tags,
      ocrText: processingResult.ocrText,
      durationSeconds: processingResult.metadata?.durationSeconds,
    });

    // Increment folder reel count
    await Folder.findByIdAndUpdate(folder._id, {
      $inc: { reelCount: 1 },
    });

    console.log(`[Reel Controller] ✓ Reel created successfully: ${reel._id}`);

    successResponse(
      res,
      201,
      {
        reel,
        timings: processingResult.timings,
      },
      "Reel extracted successfully"
    );
  } catch (error: any) {
    console.error("[Reel Controller] Error:", error);

    // Handle specific errors
    if (error.code === 11000) {
      errorResponse(res, 409, "This reel has already been extracted");
      return;
    }

    if (error.name === "ReelProcessingError") {
      errorResponse(res, error.statusCode || 500, error.message, [
        {
          step: error.step,
          details: error.rootCause?.message,
        },
      ]);
      return;
    }

    errorResponse(res, 500, "Failed to extract reel", [
      { message: error.message },
    ]);
  }
};

/**
 * Get all reels for authenticated user with pagination
 * GET /api/reel?limit=10&skip=0&folderId=xxx
 */
export const getAllReels = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
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
        errorResponse(res, 400, "Invalid folder ID format");
        return;
      }
      query.folderId = folderId;
    }

    // Get reels with pagination
    const reels = await Reel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("folderId", "name color")
      .lean();

    // Get total count for pagination
    const total = await Reel.countDocuments(query);

    successResponse(
      res,
      200,
      {
        reels,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + reels.length < total,
        },
      },
      "Reels retrieved successfully"
    );
  } catch (error: any) {
    console.error("[Reel Controller] Error:", error);
    errorResponse(res, 500, "Failed to retrieve reels", [
      { message: error.message },
    ]);
  }
};

/**
 * Get single reel by ID
 * GET /api/reel/:id
 */
export const getReelById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      errorResponse(res, 400, "Invalid reel ID format");
      return;
    }

    // Find reel
    const reel = await Reel.findOne({
      _id: id,
      userId,
      isDeleted: false,
    }).populate("folderId", "name color");

    if (!reel) {
      errorResponse(res, 404, "Reel not found");
      return;
    }

    successResponse(res, 200, reel, "Reel retrieved successfully");
  } catch (error: any) {
    console.error("[Reel Controller] Error:", error);
    errorResponse(res, 500, "Failed to retrieve reel", [
      { message: error.message },
    ]);
  }
};

/**
 * Update reel (title, folder, tags)
 * PATCH /api/reel/:id
 */
export const updateReel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { title, folderId, tags } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      errorResponse(res, 400, "Invalid reel ID format");
      return;
    }

    // Find reel
    const reel = await Reel.findOne({
      _id: id,
      userId,
      isDeleted: false,
    });

    if (!reel) {
      errorResponse(res, 404, "Reel not found");
      return;
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
        errorResponse(res, 404, "Target folder not found");
        return;
      }

      updateData.folderId = folderId;

      // Update folder counts
      await Promise.all([
        Folder.findByIdAndUpdate(oldFolderId, { $inc: { reelCount: -1 } }),
        Folder.findByIdAndUpdate(folderId, { $inc: { reelCount: 1 } }),
      ]);

      console.log(
        `[Reel Controller] Moved reel from folder ${oldFolderId} to ${folderId}`
      );
    }

    // Update reel
    const updatedReel = await Reel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("folderId", "name color");

    successResponse(res, 200, updatedReel, "Reel updated successfully");
  } catch (error: any) {
    console.error("[Reel Controller] Error:", error);
    errorResponse(res, 500, "Failed to update reel", [
      { message: error.message },
    ]);
  }
};

/**
 * Delete reel (soft delete)
 * DELETE /api/reel/:id
 */
export const deleteReel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      errorResponse(res, 400, "Invalid reel ID format");
      return;
    }

    // Find reel
    const reel = await Reel.findOne({
      _id: id,
      userId,
      isDeleted: false,
    });

    if (!reel) {
      errorResponse(res, 404, "Reel not found");
      return;
    }

    // Soft delete
    reel.isDeleted = true;
    await reel.save();

    // Decrement folder reel count
    await Folder.findByIdAndUpdate(reel.folderId, {
      $inc: { reelCount: -1 },
    });

    console.log(`[Reel Controller] ✓ Reel deleted: ${id}`);

    res.status(204).send();
  } catch (error: any) {
    console.error("[Reel Controller] Error:", error);
    errorResponse(res, 500, "Failed to delete reel", [
      { message: error.message },
    ]);
  }
};
