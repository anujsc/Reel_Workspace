import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Reel } from "../models/Reel.js";
import { successResponse } from "../utils/response.js";
import { ValidationError } from "../utils/errors.js";
import mongoose from "mongoose";

/**
 * Search result interface
 */
export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  thumbnailUrl: string;
  tags: string[];
  folderId: {
    id: string;
    name: string;
    color: string;
  };
  createdAt: Date;
  score?: number;
}

/**
 * Search response interface
 */
export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  query: string;
}

/**
 * Full-text search across reel content
 *
 * Searches across summary, transcript, and OCR text fields using MongoDB text index.
 * Results are sorted by relevance score (descending) and creation date.
 *
 * @route GET /api/search?q=keyword&limit=20&skip=0
 * @access Private
 * @param {AuthRequest} req - Express request with search query params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with search results and pagination
 * @throws {ValidationError} If query parameter is missing or invalid
 */
export const searchReels = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user!._id;
  const query = (req.query.q as string) || "";
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = parseInt(req.query.skip as string) || 0;

  // Build search query with text search
  const searchQuery: any = {
    userId,
    isDeleted: false,
    $text: { $search: query },
  };

  // Execute search with relevance score
  const results = await Reel.find(searchQuery, {
    score: { $meta: "textScore" },
  })
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("folderId", "name color")
    .select("title summary thumbnailUrl tags folderId createdAt score")
    .lean();

  // Get total count
  const total = await Reel.countDocuments(searchQuery);

  // Format results
  const formattedResults: SearchResult[] = results.map((reel: any) => ({
    id: reel._id.toString(),
    title: reel.title,
    summary: reel.summary,
    thumbnailUrl: reel.thumbnailUrl,
    tags: reel.tags,
    folderId: {
      id: reel.folderId._id.toString(),
      name: reel.folderId.name,
      color: reel.folderId.color,
    },
    createdAt: reel.createdAt,
    score: reel.score,
  }));

  const response: SearchResponse = {
    results: formattedResults,
    pagination: {
      total,
      limit,
      skip,
      hasMore: skip + results.length < total,
    },
    query,
  };

  successResponse(res, 200, response, "Search completed successfully");
};

/**
 * Filter result interface
 */
export interface FilterResult {
  id: string;
  title: string;
  summary: string;
  thumbnailUrl: string;
  tags: string[];
  folderId: {
    id: string;
    name: string;
    color: string;
  };
  createdAt: Date;
  durationSeconds?: number;
}

/**
 * Filter response interface
 */
export interface FilterResponse {
  results: FilterResult[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  filters: {
    folderId?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  counts: {
    total: number;
    filtered: number;
  };
}

/**
 * Advanced filtering for reels
 *
 * Supports filtering by folder, tags (OR logic), and date range (inclusive).
 * All filters are combined with AND logic. Returns filtered results with
 * pagination and filter statistics.
 *
 * @route GET /api/reel/filter?folderId=xxx&tags=tag1,tag2&dateFrom=2024-01-01&dateTo=2024-12-31
 * @access Private
 * @param {AuthRequest} req - Express request with filter query params
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with filtered results and counts
 * @throws {ValidationError} If folder ID or date format is invalid
 */
export const filterReels = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user!._id;
  const folderId = req.query.folderId as string;
  const tagsParam = req.query.tags as string;
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = parseInt(req.query.skip as string) || 0;

  // Build filter conditions
  const filterConditions: any[] = [{ userId }, { isDeleted: false }];

  // Folder filter
  if (folderId) {
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      throw new ValidationError("Invalid folder ID format");
    }
    filterConditions.push({ folderId });
  }

  // Tags filter (supports multiple tags)
  if (tagsParam) {
    const tags = tagsParam
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    if (tags.length > 0) {
      filterConditions.push({ tags: { $in: tags } });
    }
  }

  // Date range filter
  if (dateFrom || dateTo) {
    const dateFilter: any = {};

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (isNaN(fromDate.getTime())) {
        throw new ValidationError("Invalid dateFrom format");
      }
      dateFilter.$gte = fromDate;
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (isNaN(toDate.getTime())) {
        throw new ValidationError("Invalid dateTo format");
      }
      // Set to end of day
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
    }

    filterConditions.push({ createdAt: dateFilter });
  }

  // Combine all filters with $and
  const query = { $and: filterConditions };

  // Execute query
  const results = await Reel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("folderId", "name color")
    .select(
      "title summary thumbnailUrl tags folderId createdAt durationSeconds"
    )
    .lean();

  // Get counts
  const filteredCount = await Reel.countDocuments(query);
  const totalCount = await Reel.countDocuments({
    userId,
    isDeleted: false,
  });

  // Format results
  const formattedResults: FilterResult[] = results.map((reel: any) => ({
    id: reel._id.toString(),
    title: reel.title,
    summary: reel.summary,
    thumbnailUrl: reel.thumbnailUrl,
    tags: reel.tags,
    folderId: {
      id: reel.folderId._id.toString(),
      name: reel.folderId.name,
      color: reel.folderId.color,
    },
    createdAt: reel.createdAt,
    durationSeconds: reel.durationSeconds,
  }));

  const response: FilterResponse = {
    results: formattedResults,
    pagination: {
      total: filteredCount,
      limit,
      skip,
      hasMore: skip + results.length < filteredCount,
    },
    filters: {
      folderId: folderId || undefined,
      tags: tagsParam ? tagsParam.split(",").map((t) => t.trim()) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    counts: {
      total: totalCount,
      filtered: filteredCount,
    },
  };

  successResponse(res, 200, response, "Filter applied successfully");
};

/**
 * Get filter statistics for UI
 *
 * Returns aggregated statistics to help build filter UI:
 * - Top 50 tags with usage counts
 * - Date range (oldest to newest reel)
 * - Folder distribution with reel counts
 *
 * @route GET /api/reel/filter/stats
 * @access Private
 * @param {AuthRequest} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with filter statistics
 */
export const getFilterStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user!._id;

  // Get all unique tags
  const tagsAggregation = await Reel.aggregate([
    { $match: { userId, isDeleted: false } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]);

  // Get date range
  const dateRange = await Reel.aggregate([
    { $match: { userId, isDeleted: false } },
    {
      $group: {
        _id: null,
        oldest: { $min: "$createdAt" },
        newest: { $max: "$createdAt" },
      },
    },
  ]);

  // Get folder counts
  const folderCounts = await Reel.aggregate([
    { $match: { userId, isDeleted: false } },
    { $group: { _id: "$folderId", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "folders",
        localField: "_id",
        foreignField: "_id",
        as: "folder",
      },
    },
    { $unwind: "$folder" },
    {
      $project: {
        folderId: "$_id",
        folderName: "$folder.name",
        folderColor: "$folder.color",
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  const stats = {
    tags: tagsAggregation.map((t) => ({
      tag: t._id,
      count: t.count,
    })),
    dateRange: dateRange[0]
      ? {
          oldest: dateRange[0].oldest,
          newest: dateRange[0].newest,
        }
      : null,
    folders: folderCounts.map((f) => ({
      folderId: f.folderId,
      folderName: f.folderName,
      folderColor: f.folderColor,
      count: f.count,
    })),
  };

  successResponse(res, 200, stats, "Filter statistics retrieved successfully");
};
