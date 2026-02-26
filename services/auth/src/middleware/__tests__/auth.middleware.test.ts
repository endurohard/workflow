import { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../auth.middleware';
import { generateAccessToken } from '../../utils/jwt.util';
import { UserRole } from '../../models/user.model';
import redisClient from '../../config/redis';

// Mock redis client
jest.mock('../../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const token = generateAccessToken({
        id: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.TECHNICIAN,
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('test-user-id');
    });

    it('should reject request without authorization header', async () => {
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token format',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject blacklisted token', async () => {
      const token = generateAccessToken({
        id: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.TECHNICIAN,
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (redisClient.get as jest.Mock).mockResolvedValue('blacklisted');

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token has been revoked',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.TECHNICIAN,
        type: 'access',
      };
    });

    it('should allow access for correct role', () => {
      const middleware = requireRole([UserRole.TECHNICIAN]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for multiple allowed roles', () => {
      const middleware = requireRole([UserRole.ADMIN, UserRole.TECHNICIAN]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny access for incorrect role', () => {
      const middleware = requireRole([UserRole.ADMIN]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;
      const middleware = requireRole([UserRole.ADMIN]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
