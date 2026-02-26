import { initializeCache, getUserCache, getCacheWarmer, getCacheMonitor } from '../cache';

// Mock the Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    isOpen: true,
    isReady: true,
    on: jest.fn(),
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
    ping: jest.fn().mockResolvedValue('PONG'),
    info: jest.fn(),
    dbSize: jest.fn(),
  })),
}));

describe('Cache Module', () => {
  beforeEach(async () => {
    // Reset modules to ensure clean state
    jest.clearAllMocks();
  });

  describe('initializeCache', () => {
    it('should initialize cache successfully', async () => {
      await expect(initializeCache()).resolves.not.toThrow();
    });

    it('should connect to Redis', async () => {
      await initializeCache();
      const cache = getUserCache();
      expect(cache).toBeDefined();
    });
  });

  describe('getUserCache', () => {
    it('should return cache manager instance', async () => {
      await initializeCache();
      const cache = getUserCache();
      expect(cache).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(cache.set).toBeDefined();
    });

    it('should throw error if cache not initialized', () => {
      // Clear the module cache to reset state
      jest.resetModules();
      expect(() => require('../cache').getUserCache()).toThrow('Cache not initialized');
    });
  });

  describe('getCacheWarmer', () => {
    it('should return cache warmer instance', async () => {
      await initializeCache();
      const warmer = getCacheWarmer();
      expect(warmer).toBeDefined();
      expect(warmer.registerStrategy).toBeDefined();
    });

    it('should throw error if cache not initialized', () => {
      jest.resetModules();
      expect(() => require('../cache').getCacheWarmer()).toThrow('Cache not initialized');
    });
  });

  describe('getCacheMonitor', () => {
    it('should return cache monitor instance', async () => {
      await initializeCache();
      const monitor = getCacheMonitor();
      expect(monitor).toBeDefined();
      expect(monitor.getFullMetrics).toBeDefined();
    });

    it('should throw error if cache not initialized', () => {
      jest.resetModules();
      expect(() => require('../cache').getCacheMonitor()).toThrow('Cache not initialized');
    });
  });
});
