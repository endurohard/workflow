import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model';

export interface TokenPayload {
  userId: string;
  email?: string;
  role?: UserRole;
  type: 'access' | 'refresh' | 'reset';
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
const RESET_TOKEN_EXPIRATION = process.env.JWT_RESET_EXPIRATION || '1h';

/**
 * Generates an access token for authentication
 * @param user - User data to include in token
 * @returns JWT access token
 */
export function generateAccessToken(user: {
  id: string;
  email: string;
  role: UserRole;
}): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });
}

/**
 * Generates a refresh token for obtaining new access tokens
 * @param userId - User ID
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp' | 'email' | 'role'> = {
    userId,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });
}

/**
 * Generates a password reset token
 * @param userId - User ID
 * @returns JWT password reset token
 */
export function generatePasswordResetToken(userId: string): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp' | 'email' | 'role'> = {
    userId,
    type: 'reset',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRATION,
  });
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decodes a JWT token without verifying (use with caution)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}
