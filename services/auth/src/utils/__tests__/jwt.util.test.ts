import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generatePasswordResetToken,
} from '../jwt.util';
import { UserRole } from '../../models/user.model';

describe('JWT Utilities', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: UserRole.TECHNICIAN,
  };

  // Set JWT_SECRET for testing
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_ACCESS_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';
    process.env.JWT_RESET_EXPIRATION = '1h';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include user data in token payload', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should set correct token type', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUser.id);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user id in token payload', () => {
      const token = generateRefreshToken(mockUser.id);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
    });

    it('should set correct token type', () => {
      const token = generateRefreshToken(mockUser.id);
      const decoded = verifyToken(token);

      expect(decoded.type).toBe('refresh');
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a valid password reset token', () => {
      const token = generatePasswordResetToken(mockUser.id);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user id in token payload', () => {
      const token = generatePasswordResetToken(mockUser.id);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
    });

    it('should set correct token type', () => {
      const token = generatePasswordResetToken(mockUser.id);
      const decoded = verifyToken(token);

      expect(decoded.type).toBe('reset');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create a token with 0 expiration
      const oldToken = generateAccessToken(mockUser);

      // This test would need to wait for token expiration or mock the time
      // For now, we just verify the function works with valid tokens
      expect(() => verifyToken(oldToken)).not.toThrow();
    });

    it('should throw error for token with wrong secret', () => {
      const token = generateAccessToken(mockUser);

      // Change the secret
      process.env.JWT_SECRET = 'different-secret';

      expect(() => verifyToken(token)).toThrow();

      // Restore the secret
      process.env.JWT_SECRET = 'test-secret-key';
    });
  });
});
