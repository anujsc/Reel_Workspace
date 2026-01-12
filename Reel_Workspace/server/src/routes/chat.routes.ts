import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { ephemeralChat } from "../controllers/chat.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { body } from "express-validator";
import { validationHandler } from "../middleware/validation.js";
import rateLimit from "express-rate-limit";

const router = Router();

/**
 * Rate limiter for chat endpoint
 * Prevents abuse of AI API
 */
const chatRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour per IP
  message: {
    success: false,
    message: "Too many chat requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validation for ephemeral chat request
 */
const ephemeralChatValidation = [
  body("reelId")
    .notEmpty()
    .withMessage("Reel ID is required")
    .isMongoId()
    .withMessage("Invalid reel ID format"),
  body("messages")
    .isArray({ min: 1 })
    .withMessage("Messages array is required and must not be empty"),
  body("messages.*.role")
    .isIn(["user", "assistant"])
    .withMessage("Message role must be 'user' or 'assistant'"),
  body("messages.*.content")
    .notEmpty()
    .withMessage("Message content is required"),
];

/**
 * @route   POST /api/chat/ephemeral
 * @desc    Ephemeral AI tutor chat (session-only, not saved to DB)
 * @access  Private
 */
router.post(
  "/ephemeral",
  chatRateLimiter,
  protect,
  ephemeralChatValidation,
  validationHandler,
  asyncHandler(ephemeralChat)
);

export { router as chatRoutes };
