import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);

      res.status(201).json({
        message: 'User registered successfully',
        ...result,
      });
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({ error: error.message });
          return;
        }
      }

      res.status(500).json({ error: 'Registration failed' });
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('Invalid credentials') ||
          error.message.includes('deactivated')
        ) {
          res.status(401).json({ error: error.message });
          return;
        }
      }

      res.status(500).json({ error: 'Login failed' });
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json(result);
    } catch (error) {
      console.error('Token refresh error:', error);

      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Token refresh failed' });
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      const { refreshToken } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Token required' });
        return;
      }

      await this.authService.logout(token, refreshToken);

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  };

  /**
   * Forgot password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);

      // In production, don't send token in response, send via email
      res.status(200).json({
        message: 'Password reset instructions sent to email',
        // Remove this in production:
        resetToken: result.resetToken,
      });
    } catch (error) {
      console.error('Forgot password error:', error);

      // Always return success to prevent email enumeration
      res.status(200).json({
        message: 'If the email exists, a reset link will be sent',
      });
    }
  };

  /**
   * Reset password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);

      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);

      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Password reset failed' });
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = await this.authService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  };
}
