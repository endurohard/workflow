export { RedisClient, RedisConfig, HealthStatus } from './RedisClient';
export { CacheManager, CacheOptions, CacheStatistics, CacheEntry } from './CacheManager';
export { CacheWarmer, WarmingStrategy } from './CacheWarmer';
export {
  CacheMonitor,
  MemoryInfo,
  RedisStats,
  KeyspaceInfo,
  CacheMetrics,
} from './CacheMonitor';

// Re-export commonly used types
export type { RedisClientType } from 'redis';
