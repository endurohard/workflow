import { CacheManager } from '../CacheManager';
import { RedisClientType } from 'redis';

describe('CacheManager', () => {
  let mockRedisClient: jest.Mocked<RedisClientType>;
  let cacheManager: CacheManager;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      keys: jest.fn(),
      mGet: jest.fn(),
      mSet: jest.fn(),
      incrBy: jest.fn(),
      decrBy: jest.fn(),
    } as unknown as jest.Mocked<RedisClientType>;

    cacheManager = new CacheManager(mockRedisClient, {
      prefix: 'test',
      defaultTTL: 300,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get a value from cache', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheManager.get('key1');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key1');
    });

    it('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheManager.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should track cache hit in statistics', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ data: 'test' }));

      await cacheManager.get('key1');
      const stats = cacheManager.getStatistics();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('should track cache miss in statistics', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheManager.get('key1');
      const stats = cacheManager.getStatistics();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json');

      const result = await cacheManager.get('key1');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set a value in cache with default TTL', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.set.mockResolvedValue('OK');

      await cacheManager.set('key1', testData);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key1',
        JSON.stringify(testData),
        { EX: 300 }
      );
    });

    it('should set a value with custom TTL', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.set.mockResolvedValue('OK');

      await cacheManager.set('key1', testData, 600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key1',
        JSON.stringify(testData),
        { EX: 600 }
      );
    });

    it('should set a value without TTL when ttl is 0', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.set.mockResolvedValue('OK');

      await cacheManager.set('key1', testData, 0);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key1',
        JSON.stringify(testData)
      );
    });

    it('should handle set errors', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Set failed'));

      await expect(cacheManager.set('key1', { data: 'test' })).rejects.toThrow('Set failed');
    });
  });

  describe('del', () => {
    it('should delete a key from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheManager.del('key1');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key1');
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await cacheManager.del('nonexistent');

      expect(result).toBe(false);
    });

    it('should delete multiple keys', async () => {
      mockRedisClient.del.mockResolvedValue(2);

      const result = await cacheManager.del(['key1', 'key2']);

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['test:key1', 'test:key2']);
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheManager.exists('key1');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('test:key1');
    });

    it('should return false for non-existent key', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheManager.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('should set expiration on a key', async () => {
      mockRedisClient.expire.mockResolvedValue(true);

      const result = await cacheManager.expire('key1', 600);

      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test:key1', 600);
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.expire.mockResolvedValue(false);

      const result = await cacheManager.expire('nonexistent', 600);

      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should get TTL of a key', async () => {
      mockRedisClient.ttl.mockResolvedValue(300);

      const result = await cacheManager.ttl('key1');

      expect(result).toBe(300);
      expect(mockRedisClient.ttl).toHaveBeenCalledWith('test:key1');
    });

    it('should return -1 for key with no expiration', async () => {
      mockRedisClient.ttl.mockResolvedValue(-1);

      const result = await cacheManager.ttl('key1');

      expect(result).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      mockRedisClient.ttl.mockResolvedValue(-2);

      const result = await cacheManager.ttl('nonexistent');

      expect(result).toBe(-2);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['test:user:1', 'test:user:2']);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await cacheManager.invalidatePattern('user:*');

      expect(result).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['test:user:1', 'test:user:2']);
    });

    it('should return 0 when no keys match pattern', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await cacheManager.invalidatePattern('nonexistent:*');

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('mGet', () => {
    it('should get multiple values from cache', async () => {
      const data1 = { id: 1 };
      const data2 = { id: 2 };
      mockRedisClient.mGet.mockResolvedValue([JSON.stringify(data1), JSON.stringify(data2)]);

      const result = await cacheManager.mGet(['key1', 'key2']);

      expect(result).toEqual([data1, data2]);
      expect(mockRedisClient.mGet).toHaveBeenCalledWith(['test:key1', 'test:key2']);
    });

    it('should handle null values in result', async () => {
      mockRedisClient.mGet.mockResolvedValue([JSON.stringify({ id: 1 }), null]);

      const result = await cacheManager.mGet(['key1', 'key2']);

      expect(result).toEqual([{ id: 1 }, null]);
    });
  });

  describe('mSet', () => {
    it('should set multiple values in cache', async () => {
      mockRedisClient.mSet.mockResolvedValue('OK');

      await cacheManager.mSet([
        { key: 'key1', value: { id: 1 } },
        { key: 'key2', value: { id: 2 } },
      ]);

      expect(mockRedisClient.mSet).toHaveBeenCalledWith([
        'test:key1',
        JSON.stringify({ id: 1 }),
        'test:key2',
        JSON.stringify({ id: 2 }),
      ]);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { id: 1, name: 'Cached' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = jest.fn();
      const result = await cacheManager.getOrSet('key1', fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache value if not exists', async () => {
      const fetchedData = { id: 1, name: 'Fetched' };
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const fetchFn = jest.fn().mockResolvedValue(fetchedData);
      const result = await cacheManager.getOrSet('key1', fetchFn, 600);

      expect(result).toEqual(fetchedData);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key1',
        JSON.stringify(fetchedData),
        { EX: 600 }
      );
    });

    it('should not cache null values', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue(null);

      const result = await cacheManager.getOrSet('key1', fetchFn);

      expect(result).toBeNull();
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });
  });

  describe('increment and decrement', () => {
    it('should increment a counter', async () => {
      mockRedisClient.incrBy.mockResolvedValue(5);

      const result = await cacheManager.increment('counter', 5);

      expect(result).toBe(5);
      expect(mockRedisClient.incrBy).toHaveBeenCalledWith('test:counter', 5);
    });

    it('should decrement a counter', async () => {
      mockRedisClient.decrBy.mockResolvedValue(3);

      const result = await cacheManager.decrement('counter', 2);

      expect(result).toBe(3);
      expect(mockRedisClient.decrBy).toHaveBeenCalledWith('test:counter', 2);
    });
  });

  describe('getStatistics', () => {
    it('should return cache statistics', async () => {
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));
      mockRedisClient.get.mockResolvedValueOnce(null);

      await cacheManager.get('key1');
      await cacheManager.get('key2');

      const stats = cacheManager.getStatistics();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should handle zero requests', () => {
      const stats = cacheManager.getStatistics();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('resetStatistics', () => {
    it('should reset cache statistics', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ data: 'test' }));

      await cacheManager.get('key1');
      cacheManager.resetStatistics();

      const stats = cacheManager.getStatistics();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
