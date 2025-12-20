import { Request, Response } from "express";
import { User } from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { AuthRequest } from "../middleware/auth.js";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      errorResponse(res, 400, "User already exists");
      return;
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
    successResponse(
      res,
      201,
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
  } catch (error) {
    console.error("Register error:", error);
    errorResponse(res, 500, "Server error during registration");
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select("password");

    if (!user) {
      errorResponse(res, 401, "Invalid credentials");
      return;
    }

    // Verify password using instance method
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      errorResponse(res, 401, "Invalid credentials");
      return;
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
  } catch (error) {
    console.error("Login error:", error);
    errorResponse(res, 500, "Server error during login");
  }
};

/**
 * Get current logged-in user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // User is already attached to request by protect middleware
    if (!req.user) {
      errorResponse(res, 401, "Not authorized");
      return;
    }

    successResponse(
      res,
      200,
      {
        user: req.user,
      },
      "User retrieved successfully"
    );
  } catch (error) {
    console.error("Get me error:", error);
    errorResponse(res, 500, "Server error retrieving user");
  }
};
