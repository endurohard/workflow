import { CacheMonitor } from '../CacheMonitor';
import { RedisClient } from '../RedisClient';
import { CacheManager } from '../CacheManager';

describe('CacheMonitor', () => {
  let mockRedisClient: jest.Mocked<RedisClient>;
  let mockCacheManager: jest.Mocked<CacheManager>;
  let cacheMonitor: CacheMonitor;

  beforeEach(() => {
    mockRedisClient = {
      getClient: jest.fn().mockReturnValue({
        info: jest.fn(),
        dbSize: jest.fn(),
      }),
      healthCheck: jest.fn(),
    } as unknown as jest.Mocked<RedisClient>;

    mockCacheManager = {
      getStatistics: jest.fn(),
    } as unknown as jest.Mocked<CacheManager>;

    cacheMonitor = new CacheMonitor(mockRedisClient, mockCacheManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMemoryInfo', () => {
    it('should get memory information from Redis', async () => {
      const mockInfo = `# Memory
used_memory:1048576
used_memory_human:1.00M
used_memory_rss:2097152
used_memory_rss_human:2.00M
used_memory_peak:3145728
used_memory_peak_human:3.00M
mem_fragmentation_ratio:2.00`;

      mockRedisClient.getClient().info = jest.fn().mockResolvedValue(mockInfo);

      const memInfo = await cacheMonitor.getMemoryInfo();

      expect(memInfo).toEqual({
        used_memory: '1048576',
        used_memory_human: '1.00M',
        used_memory_rss: '2097152',
        used_memory_rss_human: '2.00M',
        used_memory_peak: '3145728',
        used_memory_peak_human: '3.00M',
        mem_fragmentation_ratio: '2.00',
      });
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.getClient().info = jest.fn().mockRejectedValue(new Error('Info failed'));

      const memInfo = await cacheMonitor.getMemoryInfo();

      expect(memInfo).toEqual({});
    });
  });

  describe('getStats', () => {
    it('should get Redis stats', async () => {
      const mockInfo = `# Stats
total_connections_received:100
total_commands_processed:1000
instantaneous_ops_per_sec:50
keyspace_hits:800
keyspace_misses:200`;

      mockRedisClient.getClient().info = jest.fn().mockResolvedValue(mockInfo);

      const stats = await cacheMonitor.getStats();

      expect(stats).toEqual({
        total_connections_received: '100',
        total_commands_processed: '1000',
        instantaneous_ops_per_sec: '50',
        keyspace_hits: '800',
        keyspace_misses: '200',
      });
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.getClient().info = jest.fn().mockRejectedValue(new Error('Info failed'));

      const stats = await cacheMonitor.getStats();

      expect(stats).toEqual({});
    });
  });

  describe('getKeyspaceInfo', () => {
    it('should get keyspace information', async () => {
      const mockInfo = `# Keyspace
db0:keys=1000,expires=500,avg_ttl=300000`;

      mockRedisClient.getClient().info = jest.fn().mockResolvedValue(mockInfo);

      const keyspace = await cacheMonitor.getKeyspaceInfo();

      expect(keyspace).toEqual({
        db0: 'keys=1000,expires=500,avg_ttl=300000',
      });
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.getClient().info = jest.fn().mockRejectedValue(new Error('Info failed'));

      const keyspace = await cacheMonitor.getKeyspaceInfo();

      expect(keyspace).toEqual({});
    });
  });

  describe('getKeyCount', () => {
    it('should get total key count', async () => {
      mockRedisClient.getClient().dbSize = jest.fn().mockResolvedValue(1000);

      const count = await cacheMonitor.getKeyCount();

      expect(count).toBe(1000);
    });

    it('should return 0 on error', async () => {
      mockRedisClient.getClient().dbSize = jest.fn().mockRejectedValue(new Error('Failed'));

      const count = await cacheMonitor.getKeyCount();

      expect(count).toBe(0);
    });
  });

  describe('getFullMetrics', () => {
    it('should get comprehensive metrics', async () => {
      const mockMemInfo = `# Memory
used_memory:1048576
used_memory_human:1.00M`;

      const mockStats = `# Stats
total_connections_received:100
keyspace_hits:800
keyspace_misses:200`;

      const mockKeyspace = `# Keyspace
db0:keys=1000,expires=500,avg_ttl=300000`;

      mockRedisClient.getClient().info = jest
        .fn()
        .mockResolvedValueOnce(mockMemInfo)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockKeyspace);

      mockRedisClient.getClient().dbSize = jest.fn().mockResolvedValue(1000);

      mockRedisClient.healthCheck.mockResolvedValue({
        status: 'healthy',
        connected: true,
        latency: 5,
      });

      mockCacheManager.getStatistics.mockReturnValue({
        hits: 800,
        misses: 200,
        hitRate: 0.8,
      });

      const metrics = await cacheMonitor.getFullMetrics();

      expect(metrics.health).toEqual({
        status: 'healthy',
        connected: true,
        latency: 5,
      });

      expect(metrics.memory).toEqual({
        used_memory: '1048576',
        used_memory_human: '1.00M',
      });

      expect(metrics.stats).toEqual({
        total_connections_received: '100',
        keyspace_hits: '800',
        keyspace_misses: '200',
      });

      expect(metrics.keyspace).toEqual({
        db0: 'keys=1000,expires=500,avg_ttl=300000',
      });

      expect(metrics.keyCount).toBe(1000);

      expect(metrics.cacheManagerStats).toEqual({
        hits: 800,
        misses: 200,
        hitRate: 0.8,
      });

      expect(metrics.timestamp).toBeDefined();
    });

    it('should handle partial failures gracefully', async () => {
      mockRedisClient.getClient().info = jest.fn().mockRejectedValue(new Error('Failed'));
      mockRedisClient.getClient().dbSize = jest.fn().mockRejectedValue(new Error('Failed'));

      mockRedisClient.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        connected: false,
      });

      mockCacheManager.getStatistics.mockReturnValue({
        hits: 0,
        misses: 0,
        hitRate: 0,
      });

      const metrics = await cacheMonitor.getFullMetrics();

      expect(metrics.health.status).toBe('unhealthy');
      expect(metrics.memory).toEqual({});
      expect(metrics.stats).toEqual({});
      expect(metrics.keyspace).toEqual({});
      expect(metrics.keyCount).toBe(0);
    });
  });
});
