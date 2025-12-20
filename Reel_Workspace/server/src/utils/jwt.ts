import jwt from "jsonwebtoken";

/**
 * JWT Payload interface
 */
interface JWTPayload {
  id: string;
}

/**
 * Generate JWT token for user authentication
 * @param userId - User ID to encode in token
 * @returns Signed JWT token string
 */
export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  const payload: JWTPayload = {
    id: userId,
  };

  return jwt.sign(payload, secret, { expiresIn: expiresIn } as any);
};

/**
 * Verify and decode JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
};
