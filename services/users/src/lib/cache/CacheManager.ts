import { RedisClientType } from 'redis';

export interface CacheOptions {
  prefix?: string;
  defaultTTL?: number;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface CacheEntry {
  key: string;
  value: unknown;
  ttl?: number;
}

/**
 * CacheManager - Implements cache-aside pattern with statistics
 * Provides high-level caching operations with automatic serialization
 */
export class CacheManager {
  private client: RedisClientType;
  private options: CacheOptions;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(client: RedisClientType, options: CacheOptions = {}) {
    this.client = client;
    this.options = {
      prefix: options.prefix || 'cache',
      defaultTTL: options.defaultTTL || 3600, // 1 hour default
    };
  }

  /**
   * Build full key with prefix
   */
  private buildKey(key: string): string {
    return `${this.options.prefix}:${key}`;
  }

  /**
   * Build full keys array with prefix
   */
  private buildKeys(keys: string[]): string[] {
    return keys.map((key) => this.buildKey(key));
  }

  /**
   * Get a value from cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const value = await this.client.get(fullKey);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      try {
        return JSON.parse(value) as T;
      } catch {
        // If JSON parse fails, return null
        return null;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      const serialized = JSON.stringify(value);
      const ttlToUse = ttl ?? this.options.defaultTTL;

      if (ttlToUse && ttlToUse > 0) {
        await this.client.set(fullKey, serialized, { EX: ttlToUse });
      } else {
        await this.client.set(fullKey, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete one or more keys from cache
   */
  async del(key: string | string[]): Promise<boolean> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      const fullKeys = this.buildKeys(keys);
      const result = await this.client.del(fullKeys);
      return result > 0;
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration time on a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.expire(fullKey, ttl);
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   * Returns:
   * - TTL in seconds if key exists and has expiration
   * - -1 if key exists but has no expiration
   * - -2 if key does not exist
   */
  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      console.error(`Cache ttl error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await this.client.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      return await this.client.del(keys);
    } catch (error) {
      console.error(`Cache invalidatePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mGet<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = this.buildKeys(keys);
      const values = await this.client.mGet(fullKeys);

      return values.map((value) => {
        if (value === null) {
          return null;
        }

        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mGet error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mSet(entries: CacheEntry[]): Promise<void> {
    try {
      const pairs: string[] = [];

      for (const entry of entries) {
        pairs.push(this.buildKey(entry.key));
        pairs.push(JSON.stringify(entry.value));
      }

      await this.client.mSet(pairs);

      // Set TTLs separately if specified
      for (const entry of entries) {
        if (entry.ttl !== undefined && entry.ttl > 0) {
          await this.expire(entry.key, entry.ttl);
        }
      }
    } catch (error) {
      console.error('Cache mSet error:', error);
      throw error;
    }
  }

  /**
   * Cache-aside pattern: Get from cache or fetch and cache
   */
  async getOrSet<T = unknown>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch the data
    try {
      const data = await fetchFn();

      // Only cache non-null values
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }

      return data;
    } catch (error) {
      console.error(`Cache getOrSet fetch error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Increment a counter in cache
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.incrBy(fullKey, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement a counter in cache
   */
  async decrement(key: string, amount = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.decrBy(fullKey, amount);
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStatistics(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }
}
