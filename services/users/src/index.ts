import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Database from './config/database';
import RedisClient from './config/redis';
import userRoutes from './routes/user.routes';
import technicianRoutes from './routes/technician.routes';
import clientRoutes from './routes/client.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profile-photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'users-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/clients', clientRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);

  // Multer errors
  if (err.message.includes('file type')) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.message.includes('File too large')) {
    res.status(400).json({ error: 'File size exceeds the 5MB limit' });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize connections and start server
async function startServer() {
  try {
    // Test database connection
    const db = Database.getInstance();
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Connect to Redis
    const redis = RedisClient.getInstance();
    await redis.connect();

    if (!redis.getConnectionStatus()) {
      console.warn('Warning: Redis connection failed. Caching will be disabled.');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Users Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const db = Database.getInstance();
  await db.close();

  const redis = RedisClient.getInstance();
  await redis.close();

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const db = Database.getInstance();
  await db.close();

  const redis = RedisClient.getInstance();
  await redis.close();

  process.exit(0);
});

startServer();
