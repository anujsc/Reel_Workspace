import { Request, Response, NextFunction } from "express";
import { IUser, User } from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";

/**
 * Extend Express Request interface to include user property
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      errorResponse(res, 401, "Not authorized, no token");
      return;
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.split(" ")[1];

    if (!token) {
      errorResponse(res, 401, "Not authorized, no token");
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      errorResponse(res, 401, "Token is not valid");
      return;
    }

    // Find user by ID from token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      errorResponse(res, 401, "User not found");
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    errorResponse(res, 401, "Not authorized");
  }
};
