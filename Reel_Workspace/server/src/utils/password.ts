import crypto from "crypto";

/**
 * Password validation result interface
 */
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength and requirements
 * @param password - Password to validate
 * @returns Validation result with errors if any
 */
export const validatePassword = (
  password: string
): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate a random reset token for password reset functionality
 * @returns Random hex string (32 bytes)
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};
