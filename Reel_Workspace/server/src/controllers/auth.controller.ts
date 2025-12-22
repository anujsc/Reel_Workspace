import { Request, Response } from "express";
import { User } from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { successResponse, createdResponse } from "../utils/response.js";
import { AuthRequest } from "../middleware/auth.js";
import {
  ConflictError,
  AuthenticationError,
  DatabaseError,
} from "../utils/errors.js";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Create new user (password will be hashed by pre-save hook)
  const user = new User({
    email,
    password,
  });

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id.toString());

  // Return user data and token
  createdResponse(
    res,
    {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    },
    "User registered successfully"
  );
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Find user by email and explicitly select password field
  const user = await User.findOne({ email }).select("password");

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  // Verify password using instance method
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  // Generate JWT token
  const token = generateToken(user._id.toString());

  // Return user data and token (password excluded by toJSON)
  successResponse(
    res,
    200,
    {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    },
    "Login successful"
  );
};

/**
 * Get current logged-in user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  // User is already attached to request by protect middleware
  if (!req.user) {
    throw new AuthenticationError("Not authorized");
  }

  successResponse(
    res,
    200,
    {
      user: req.user,
    },
    "User retrieved successfully"
  );
};
