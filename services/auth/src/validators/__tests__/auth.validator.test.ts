import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../auth.validator';
import { UserRole } from '../../models/user.model';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Test@1234',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
      };

      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Test@1234',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('email');
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Test@1234',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should accept default role', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Test@1234',
        firstName: 'John',
        lastName: 'Doe',
      };

      const { error, value } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.role).toBe(UserRole.TECHNICIAN);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Test@1234',
      };

      const { error } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Test@1234',
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate correct refresh token data', () => {
      const validData = {
        refreshToken: 'valid.jwt.token',
      };

      const { error } = refreshTokenSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing refresh token', () => {
      const invalidData = {};

      const { error } = refreshTokenSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject empty refresh token', () => {
      const invalidData = {
        refreshToken: '',
      };

      const { error } = refreshTokenSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate correct email', () => {
      const validData = {
        email: 'test@example.com',
      };

      const { error } = forgotPasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const { error } = forgotPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing email', () => {
      const invalidData = {};

      const { error } = forgotPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate correct reset password data', () => {
      const validData = {
        token: 'valid.jwt.token',
        newPassword: 'NewPass@1234',
      };

      const { error } = resetPasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject weak password', () => {
      const invalidData = {
        token: 'valid.jwt.token',
        newPassword: '123',
      };

      const { error } = resetPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing token', () => {
      const invalidData = {
        newPassword: 'NewPass@1234',
      };

      const { error } = resetPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
