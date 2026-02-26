import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.util';
import redisClient from '../config/redis';
import { UserRole } from '../models/user.model';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Verifies the token and checks if it's blacklisted
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    const token = parts[1];

    // Check if token is blacklisted
    try {
      const blacklisted = await redisClient.get(`blacklist:${token}`);
      if (blacklisted) {
        res.status(401).json({ error: 'Token has been revoked' });
        return;
      }
    } catch (redisError) {
      console.error('Redis error:', redisError);
      // Continue even if Redis is down (fail open for token blacklist check)
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

/**
 * Middleware to check if user has required role(s)
 * Must be used after authenticate middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
