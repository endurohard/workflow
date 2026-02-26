import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role, firstName, lastName } = req.body;

      // Валидация
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // TODO: Сохранение в БД
      // const user = await userRepository.create({ email, hashedPassword, role, firstName, lastName });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          email,
          role: role || 'technician',
          firstName,
          lastName
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // TODO: Получение пользователя из БД
      // const user = await userRepository.findByEmail(email);
      // if (!user) {
      //   res.status(401).json({ error: 'Invalid credentials' });
      //   return;
      // }

      // Проверка пароля
      // const isPasswordValid = await bcrypt.compare(password, user.password);
      // if (!isPasswordValid) {
      //   res.status(401).json({ error: 'Invalid credentials' });
      //   return;
      // }

      // Генерация JWT токена
      const token = jwt.sign(
        {
          userId: 'user-id',
          email,
          role: 'technician'
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: 'user-id' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        refreshToken,
        user: {
          email,
          role: 'technician'
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      // Проверка refresh токена
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'secret') as any;

      // Генерация нового access токена
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        token: newToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Добавить токен в blacklist в Redis
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // TODO: Генерация токена сброса пароля и отправка email
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      // TODO: Проверка токена и обновление пароля
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
}
