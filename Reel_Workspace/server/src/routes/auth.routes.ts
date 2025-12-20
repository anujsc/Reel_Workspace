import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import {
  registerValidation,
  loginValidation,
  validationHandler,
} from "../middleware/validation.js";
import { protect } from "../middleware/auth.js";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", registerValidation, validationHandler, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post("/login", loginValidation, validationHandler, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get("/me", protect, getMe);

export const authRoutes = router;
