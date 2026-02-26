import { RedisClient } from '../RedisClient';
import { createClient, RedisClientType } from 'redis';

jest.mock('redis');

describe('RedisClient', () => {
  let mockRedisClient: jest.Mocked<RedisClientType>;
  let redisClient: RedisClient;

  beforeEach(() => {
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      isOpen: true,
      isReady: true,
      on: jest.fn(),
    } as unknown as jest.Mocked<RedisClientType>;

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);
    redisClient = new RedisClient({
      host: 'localhost',
      port: 6379,
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a Redis client with default configuration', () => {
      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          socket: {
            host: 'localhost',
            port: 6379,
            reconnectStrategy: expect.any(Function),
          },
        })
      );
    });

    it('should create a Redis client with custom configuration', () => {
      new RedisClient({
        host: 'redis-server',
        port: 6380,
        password: 'secret',
        db: 1,
      });

      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          socket: expect.objectContaining({
            host: 'redis-server',
            port: 6380,
          }),
          password: 'secret',
          database: 1,
        })
      );
    });
  });

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      await redisClient.connect();
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should not connect twice if already connected', async () => {
      await redisClient.connect();
      await redisClient.connect();
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValueOnce(error);

      await expect(redisClient.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      await redisClient.connect();
      await redisClient.disconnect();
      expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
    });

    it('should not fail if already disconnected', async () => {
      await redisClient.disconnect();
      expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
    });
  });

  describe('getClient', () => {
    it('should return the Redis client instance', () => {
      const client = redisClient.getClient();
      expect(client).toBe(mockRedisClient);
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', () => {
      expect(redisClient.isConnected()).toBe(true);
    });

    it('should return false when not connected', () => {
      mockRedisClient.isOpen = false;
      expect(redisClient.isConnected()).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connected', async () => {
      mockRedisClient.ping = jest.fn().mockResolvedValue('PONG');

      const health = await redisClient.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return unhealthy status when disconnected', async () => {
      mockRedisClient.isOpen = false;

      const health = await redisClient.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.connected).toBe(false);
    });

    it('should return unhealthy status on ping error', async () => {
      mockRedisClient.ping = jest.fn().mockRejectedValue(new Error('Ping failed'));

      const health = await redisClient.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Ping failed');
    });
  });
});
