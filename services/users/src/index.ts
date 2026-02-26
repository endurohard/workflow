import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeCache, getUserCache, getCacheMonitor, getCacheWarmer } from './cache';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize cache on startup
let cacheInitialized = false;

async function startServer() {
  try {
    await initializeCache();
    cacheInitialized = true;

    // Setup cache warming strategies
    const warmer = getCacheWarmer();

    // Warm up active users on startup
    warmer.registerStrategy('active-users', async () => {
      // TODO: Implement when database is connected
      // For now, return empty array
      return [];
    });

    console.log('Cache warming strategies registered');
  } catch (error) {
    console.error('Warning: Cache initialization failed. Running without cache.', error);
  }

  app.listen(PORT, () => {
    console.log(`Users Service running on port ${PORT}`);
  });
}

// Health endpoint with cache status
app.get('/health', async (req: Request, res: Response) => {
  const response: {
    status: string;
    service: string;
    timestamp: string;
    cache?: {
      status: string;
      statistics?: unknown;
    };
  } = {
    status: 'healthy',
    service: 'users-service',
    timestamp: new Date().toISOString(),
  };

  if (cacheInitialized) {
    try {
      const cache = getUserCache();
      response.cache = {
        status: 'connected',
        statistics: cache.getStatistics(),
      };
    } catch (error) {
      response.cache = {
        status: 'disconnected',
      };
    }
  }

  res.status(200).json(response);
});

// Cache metrics endpoint
app.get('/api/cache/metrics', async (req: Request, res: Response) => {
  if (!cacheInitialized) {
    return res.status(503).json({ error: 'Cache not initialized' });
  }

  try {
    const monitor = getCacheMonitor();
    const metrics = await monitor.getFullMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache metrics' });
  }
});

// Cache warming endpoint (admin only in production)
app.post('/api/cache/warm', async (req: Request, res: Response) => {
  if (!cacheInitialized) {
    return res.status(503).json({ error: 'Cache not initialized' });
  }

  try {
    const warmer = getCacheWarmer();
    await warmer.warmUpAll();
    res.json({ message: 'Cache warming completed' });
  } catch (error) {
    res.status(500).json({ error: 'Cache warming failed' });
  }
});

// Users endpoints with caching
app.get('/api/users', async (req: Request, res: Response) => {
  if (cacheInitialized) {
    try {
      const cache = getUserCache();

      // Try to get from cache
      const cachedUsers = await cache.getOrSet(
        'all-users',
        async () => {
          // TODO: Fetch from database when connected
          return [];
        },
        300 // 5 minutes TTL
      );

      res.json({ users: cachedUsers });
    } catch (error) {
      console.error('Cache error:', error);
      res.json({ users: [] });
    }
  } else {
    res.json({ users: [] });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;

  if (cacheInitialized) {
    try {
      const cache = getUserCache();

      // Try to get user from cache
      const user = await cache.getOrSet(
        `profile:${userId}`,
        async () => {
          // TODO: Fetch from database when connected
          return { id: userId, name: 'Mock User' };
        },
        3600 // 1 hour TTL
      );

      res.json({ user });
    } catch (error) {
      console.error('Cache error:', error);
      res.json({ user: { id: userId } });
    }
  } else {
    res.json({ user: { id: userId } });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  // TODO: Create user in database

  // Invalidate users list cache
  if (cacheInitialized) {
    try {
      const cache = getUserCache();
      await cache.del('all-users');
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  res.status(201).json({ message: 'User created' });
});

app.put('/api/users/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;

  // TODO: Update user in database

  // Invalidate user cache
  if (cacheInitialized) {
    try {
      const cache = getUserCache();
      await cache.del([`profile:${userId}`, 'all-users']);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  res.json({ message: 'User updated' });
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;

  // TODO: Delete user from database

  // Invalidate user cache
  if (cacheInitialized) {
    try {
      const cache = getUserCache();
      await cache.del([`profile:${userId}`, 'all-users']);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  res.json({ message: 'User deleted' });
});

// Technicians endpoints with caching
app.get('/api/users/technicians', async (req: Request, res: Response) => {
  if (cacheInitialized) {
    try {
      const cache = getUserCache();

      const technicians = await cache.getOrSet(
        'all-technicians',
        async () => {
          // TODO: Fetch from database when connected
          return [];
        },
        600 // 10 minutes TTL
      );

      res.json({ technicians });
    } catch (error) {
      console.error('Cache error:', error);
      res.json({ technicians: [] });
    }
  } else {
    res.json({ technicians: [] });
  }
});

app.get('/api/users/technicians/:id/schedule', async (req: Request, res: Response) => {
  const technicianId = req.params.id;

  if (cacheInitialized) {
    try {
      const cache = getUserCache();

      const schedule = await cache.getOrSet(
        `technician:${technicianId}:schedule`,
        async () => {
          // TODO: Fetch from database when connected
          return [];
        },
        1800 // 30 minutes TTL
      );

      res.json({ schedule });
    } catch (error) {
      console.error('Cache error:', error);
      res.json({ schedule: [] });
    }
  } else {
    res.json({ schedule: [] });
  }
});

// Start the server
startServer();
