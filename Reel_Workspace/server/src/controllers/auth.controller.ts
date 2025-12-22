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
 * Register a new user account
 *
 * Creates a new user with email and password. Password is automatically hashed
 * using bcrypt before storage. Returns user data and JWT token for immediate authentication.
 *
 * @route POST /api/auth/register
 * @access Public
 * @param {Request} req - Express request object with email and password in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 201 response with user data and JWT token
 * @throws {ConflictError} If email already exists
 * @throws {DatabaseError} If user creation fails
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
 * Authenticate user and generate JWT token
 *
 * Validates user credentials and returns JWT token for subsequent authenticated requests.
 * Password is verified using bcrypt comparison.
 *
 * @route POST /api/auth/login
 * @access Public
 * @param {Request} req - Express request object with email and password in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with user data and JWT token
 * @throws {AuthenticationError} If email not found or password incorrect
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
 * Get current authenticated user information
 *
 * Returns the user data for the currently authenticated user.
 * User is attached to request by the protect middleware.
 *
 * @route GET /api/auth/me
 * @access Private (requires JWT token)
 * @param {AuthRequest} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 200 response with user data
 * @throws {AuthenticationError} If user not found in request
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
