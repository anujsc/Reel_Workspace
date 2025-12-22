import { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import {
  isValidInstagramUrl,
  isValidHexColor,
  isValidObjectId,
} from "./validation.js";

/**
 * Legacy middleware functions for backward compatibility
 * These are kept for existing routes that haven't been migrated to express-validator
 *
 * RECOMMENDED: Migrate to use validation chains from validation.ts instead
 */

/**
 * Validate Instagram URL format (utility function)
 */
export const validateInstagramUrl = isValidInstagramUrl;

/**
 * Validate hex color code (utility function)
 */
export const validateHexColor = isValidHexColor;

/**
 * Validate MongoDB ObjectId (utility function)
 */
export const validateObjectId = isValidObjectId;
