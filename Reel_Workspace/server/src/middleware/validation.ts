import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorResponse } from "../utils/response.js";

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .trim(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .trim(),
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .trim(),
  body("password").notEmpty().withMessage("Password is required").trim(),
];

/**
 * Middleware to handle validation results
 * Returns 400 error if validation fails
 */
export const validationHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === "field" ? (err as any).path : "unknown",
      message: err.msg,
    }));

    errorResponse(res, 400, "Validation failed", errorMessages);
    return;
  }

  next();
};
