import { RedisClient, HealthStatus } from './RedisClient';
import { CacheManager, CacheStatistics } from './CacheManager';

export interface MemoryInfo {
  [key: string]: string;
}

export interface RedisStats {
  [key: string]: string;
}

export interface KeyspaceInfo {
  [key: string]: string;
}

export interface CacheMetrics {
  health: HealthStatus;
  memory: MemoryInfo;
  stats: RedisStats;
  keyspace: KeyspaceInfo;
  keyCount: number;
  cacheManagerStats: CacheStatistics;
  timestamp: string;
}

/**
 * CacheMonitor - Monitors Redis cache health and performance
 * Provides metrics and statistics for cache operations
 */
export class CacheMonitor {
  private redisClient: RedisClient;
  private cacheManager: CacheManager;

  constructor(redisClient: RedisClient, cacheManager: CacheManager) {
    this.redisClient = redisClient;
    this.cacheManager = cacheManager;
  }

  /**
   * Parse Redis INFO command output
   */
  private parseInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line && !line.startsWith('#') && line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get Redis memory information
   */
  async getMemoryInfo(): Promise<MemoryInfo> {
    try {
      const client = this.redisClient.getClient();
      const info = await client.info('memory');
      return this.parseInfo(info);
    } catch (error) {
      console.error('Error getting memory info:', error);
      return {};
    }
  }

  /**
   * Get Redis statistics
   */
  async getStats(): Promise<RedisStats> {
    try {
      const client = this.redisClient.getClient();
      const info = await client.info('stats');
      return this.parseInfo(info);
    } catch (error) {
      console.error('Error getting stats:', error);
      return {};
    }
  }

  /**
   * Get keyspace information
   */
  async getKeyspaceInfo(): Promise<KeyspaceInfo> {
    try {
      const client = this.redisClient.getClient();
      const info = await client.info('keyspace');
      return this.parseInfo(info);
    } catch (error) {
      console.error('Error getting keyspace info:', error);
      return {};
    }
  }

  /**
   * Get total key count
   */
  async getKeyCount(): Promise<number> {
    try {
      const client = this.redisClient.getClient();
      return await client.dbSize();
    } catch (error) {
      console.error('Error getting key count:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive cache metrics
   */
  async getFullMetrics(): Promise<CacheMetrics> {
    const [health, memory, stats, keyspace, keyCount] = await Promise.all([
      this.redisClient.healthCheck(),
      this.getMemoryInfo(),
      this.getStats(),
      this.getKeyspaceInfo(),
      this.getKeyCount(),
    ]);

    return {
      health,
      memory,
      stats,
      keyspace,
      keyCount,
      cacheManagerStats: this.cacheManager.getStatistics(),
      timestamp: new Date().toISOString(),
    };
  }
}
