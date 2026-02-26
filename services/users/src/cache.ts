import { RedisClient } from './lib/cache/RedisClient';
import { CacheManager } from './lib/cache/CacheManager';
import { CacheWarmer } from './lib/cache/CacheWarmer';
import { CacheMonitor } from './lib/cache/CacheMonitor';

let redisClient: RedisClient | null = null;
let cacheManager: CacheManager | null = null;
let cacheWarmer: CacheWarmer | null = null;
let cacheMonitor: CacheMonitor | null = null;

/**
 * Initialize Redis cache for users service
 */
export async function initializeCache(): Promise<void> {
  try {
    // Create Redis client
    redisClient = new RedisClient({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      maxRetriesPerRequest: 10,
      retryDelayMs: 1000,
    });

    // Connect to Redis
    await redisClient.connect();

    // Create cache manager with users prefix
    cacheManager = new CacheManager(redisClient.getClient(), {
      prefix: 'users',
      defaultTTL: 3600, // 1 hour default
    });

    // Create cache warmer
    cacheWarmer = new CacheWarmer(cacheManager);

    // Create cache monitor
    cacheMonitor = new CacheMonitor(redisClient, cacheManager);

    console.log('✓ Users cache initialized successfully');
  } catch (error) {
    console.error('Failed to initialize users cache:', error);
    throw error;
  }
}

/**
 * Get cache manager instance
 */
export function getUserCache(): CacheManager {
  if (!cacheManager) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return cacheManager;
}

/**
 * Get cache warmer instance
 */
export function getCacheWarmer(): CacheWarmer {
  if (!cacheWarmer) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return cacheWarmer;
}

/**
 * Get cache monitor instance
 */
export function getCacheMonitor(): CacheMonitor {
  if (!cacheMonitor) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return cacheMonitor;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClient {
  if (!redisClient) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return redisClient;
}

/**
 * Disconnect from Redis
 */
export async function disconnectCache(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    cacheManager = null;
    cacheWarmer = null;
    cacheMonitor = null;
    console.log('✓ Users cache disconnected');
  }
}
