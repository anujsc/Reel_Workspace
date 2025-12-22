/**
 * Validation Utilities
 * Reusable validation functions for common patterns
 */

import mongoose from "mongoose";

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * Instagram URL validation regex
 * Matches: instagram.com/p/, instagram.com/reel/, instagram.com/reels/, instagram.com/tv/
 */
export const INSTAGRAM_URL_REGEX =
  /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/i;

/**
 * Hex color validation regex (#RRGGBB format)
 */
export const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;

/**
 * Email validation regex (RFC 5322 simplified)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password strength regex
 * At least one uppercase, one lowercase, one number
 */
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * URL validation regex (http/https)
 */
export const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Username validation regex (alphanumeric, underscore, hyphen, 3-30 chars)
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

/**
 * Slug validation regex (lowercase, numbers, hyphens)
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Instagram URL format
 * @param url - URL to validate
 * @returns true if valid Instagram URL
 */
export const isValidInstagramUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  return INSTAGRAM_URL_REGEX.test(url.trim());
};

/**
 * Validate hex color code
 * @param color - Color code to validate
 * @returns true if valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  if (!color || typeof color !== "string") return false;
  return HEX_COLOR_REGEX.test(color.trim());
};

/**
 * Validate MongoDB ObjectId
 * @param id - ID to validate
 * @returns true if valid ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param email - Email to validate
 * @returns true if valid email
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns true if password meets strength requirements
 */
export const isStrongPassword = (password: string): boolean => {
  if (!password || typeof password !== "string") return false;
  return password.length >= 8 && PASSWORD_STRENGTH_REGEX.test(password);
};

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns true if valid URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  return URL_REGEX.test(url.trim());
};

/**
 * Validate username format
 * @param username - Username to validate
 * @returns true if valid username
 */
export const isValidUsername = (username: string): boolean => {
  if (!username || typeof username !== "string") return false;
  return USERNAME_REGEX.test(username.trim());
};

/**
 * Validate slug format
 * @param slug - Slug to validate
 * @returns true if valid slug
 */
export const isValidSlug = (slug: string): boolean => {
  if (!slug || typeof slug !== "string") return false;
  return SLUG_REGEX.test(slug.trim());
};

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize string input (remove dangerous characters)
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "");
};

/**
 * Sanitize HTML (strip all HTML tags)
 * @param input - String to sanitize
 * @returns String without HTML tags
 */
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "").trim();
};

/**
 * Normalize email (lowercase and trim)
 * @param email - Email to normalize
 * @returns Normalized email
 */
export const normalizeEmail = (email: string): string => {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim();
};

/**
 * Generate slug from string
 * @param text - Text to convert to slug
 * @returns Slug string
 */
export const generateSlug = (text: string): string => {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// ============================================================================
// ARRAY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate array of strings
 * @param arr - Array to validate
 * @param maxLength - Maximum array length
 * @param maxItemLength - Maximum length of each item
 * @returns Validation result
 */
export const validateStringArray = (
  arr: any,
  maxLength: number = 100,
  maxItemLength: number = 255
): { valid: boolean; error?: string } => {
  if (!Array.isArray(arr)) {
    return { valid: false, error: "Must be an array" };
  }

  if (arr.length > maxLength) {
    return { valid: false, error: `Array cannot exceed ${maxLength} items` };
  }

  for (const item of arr) {
    if (typeof item !== "string") {
      return { valid: false, error: "All items must be strings" };
    }

    if (item.trim().length === 0) {
      return { valid: false, error: "Items cannot be empty strings" };
    }

    if (item.length > maxItemLength) {
      return {
        valid: false,
        error: `Each item cannot exceed ${maxItemLength} characters`,
      };
    }
  }

  return { valid: true };
};

/**
 * Validate array of ObjectIds
 * @param arr - Array to validate
 * @param maxLength - Maximum array length
 * @returns Validation result
 */
export const validateObjectIdArray = (
  arr: any,
  maxLength: number = 100
): { valid: boolean; error?: string } => {
  if (!Array.isArray(arr)) {
    return { valid: false, error: "Must be an array" };
  }

  if (arr.length > maxLength) {
    return { valid: false, error: `Array cannot exceed ${maxLength} items` };
  }

  for (const item of arr) {
    if (!isValidObjectId(item)) {
      return { valid: false, error: "All items must be valid ObjectIds" };
    }
  }

  return { valid: true };
};

// ============================================================================
// DATE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate date range
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @param maxYears - Maximum years between dates
 * @returns Validation result
 */
export const validateDateRange = (
  dateFrom: Date | string,
  dateTo: Date | string,
  maxYears: number = 5
): { valid: boolean; error?: string } => {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime())) {
    return { valid: false, error: "Invalid dateFrom" };
  }

  if (isNaN(to.getTime())) {
    return { valid: false, error: "Invalid dateTo" };
  }

  if (from > to) {
    return { valid: false, error: "dateFrom must be before dateTo" };
  }

  const diffYears =
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (diffYears > maxYears) {
    return {
      valid: false,
      error: `Date range cannot exceed ${maxYears} years`,
    };
  }

  return { valid: true };
};

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns true if date is in the past
 */
export const isDateInPast = (date: Date | string): boolean => {
  const d = new Date(date);
  return d < new Date();
};

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns true if date is in the future
 */
export const isDateInFuture = (date: Date | string): boolean => {
  const d = new Date(date);
  return d > new Date();
};

// ============================================================================
// NUMBER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate number is within range
 * @param value - Value to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Validation result
 */
export const validateNumberRange = (
  value: any,
  min: number,
  max: number
): { valid: boolean; error?: string } => {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: "Must be a number" };
  }

  if (num < min || num > max) {
    return { valid: false, error: `Must be between ${min} and ${max}` };
  }

  return { valid: true };
};

/**
 * Validate positive integer
 * @param value - Value to validate
 * @returns true if positive integer
 */
export const isPositiveInteger = (value: any): boolean => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * Validate non-negative integer
 * @param value - Value to validate
 * @returns true if non-negative integer
 */
export const isNonNegativeInteger = (value: any): boolean => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
};
