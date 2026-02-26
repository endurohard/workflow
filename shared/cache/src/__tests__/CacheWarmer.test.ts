import { CacheWarmer } from '../CacheWarmer';
import { CacheManager } from '../CacheManager';

describe('CacheWarmer', () => {
  let mockCacheManager: jest.Mocked<CacheManager>;
  let cacheWarmer: CacheWarmer;

  beforeEach(() => {
    mockCacheManager = {
      set: jest.fn(),
      mSet: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<CacheManager>;

    cacheWarmer = new CacheWarmer(mockCacheManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('warmUp', () => {
    it('should warm up cache with single strategy', async () => {
      const fetchFn = jest.fn().mockResolvedValue([
        { key: 'user:1', value: { id: 1, name: 'User 1' }, ttl: 300 },
      ]);

      mockCacheManager.set.mockResolvedValue(undefined);

      await cacheWarmer.warmUp('users', fetchFn);

      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:1',
        { id: 1, name: 'User 1' },
        300
      );
    });

    it('should warm up cache with multiple entries', async () => {
      const entries = [
        { key: 'user:1', value: { id: 1 }, ttl: 300 },
        { key: 'user:2', value: { id: 2 }, ttl: 300 },
        { key: 'user:3', value: { id: 3 }, ttl: 300 },
      ];

      const fetchFn = jest.fn().mockResolvedValue(entries);
      mockCacheManager.set.mockResolvedValue(undefined);

      await cacheWarmer.warmUp('users', fetchFn);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(3);
    });

    it('should handle errors during warming', async () => {
      const fetchFn = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(cacheWarmer.warmUp('users', fetchFn)).rejects.toThrow('Fetch failed');
    });

    it('should skip entries without keys', async () => {
      const entries = [
        { key: 'user:1', value: { id: 1 }, ttl: 300 },
        { key: '', value: { id: 2 }, ttl: 300 }, // Invalid key
        { key: 'user:3', value: { id: 3 }, ttl: 300 },
      ];

      const fetchFn = jest.fn().mockResolvedValue(entries);
      mockCacheManager.set.mockResolvedValue(undefined);

      await cacheWarmer.warmUp('users', fetchFn);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('registerStrategy', () => {
    it('should register a warming strategy', () => {
      const fetchFn = jest.fn().mockResolvedValue([]);

      cacheWarmer.registerStrategy('users', fetchFn);

      expect(cacheWarmer.hasStrategy('users')).toBe(true);
    });

    it('should override existing strategy', () => {
      const fetchFn1 = jest.fn().mockResolvedValue([]);
      const fetchFn2 = jest.fn().mockResolvedValue([]);

      cacheWarmer.registerStrategy('users', fetchFn1);
      cacheWarmer.registerStrategy('users', fetchFn2);

      expect(cacheWarmer.hasStrategy('users')).toBe(true);
    });
  });

  describe('hasStrategy', () => {
    it('should return true for registered strategy', () => {
      const fetchFn = jest.fn().mockResolvedValue([]);
      cacheWarmer.registerStrategy('users', fetchFn);

      expect(cacheWarmer.hasStrategy('users')).toBe(true);
    });

    it('should return false for unregistered strategy', () => {
      expect(cacheWarmer.hasStrategy('nonexistent')).toBe(false);
    });
  });

  describe('warmUpAll', () => {
    it('should warm up all registered strategies', async () => {
      const usersFetchFn = jest.fn().mockResolvedValue([
        { key: 'user:1', value: { id: 1 }, ttl: 300 },
      ]);

      const schedulesFetchFn = jest.fn().mockResolvedValue([
        { key: 'schedule:1', value: { id: 1 }, ttl: 600 },
      ]);

      mockCacheManager.set.mockResolvedValue(undefined);

      cacheWarmer.registerStrategy('users', usersFetchFn);
      cacheWarmer.registerStrategy('schedules', schedulesFetchFn);

      await cacheWarmer.warmUpAll();

      expect(usersFetchFn).toHaveBeenCalledTimes(1);
      expect(schedulesFetchFn).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });

    it('should continue warming even if one strategy fails', async () => {
      const successFn = jest.fn().mockResolvedValue([
        { key: 'user:1', value: { id: 1 }, ttl: 300 },
      ]);

      const failFn = jest.fn().mockRejectedValue(new Error('Failed'));

      mockCacheManager.set.mockResolvedValue(undefined);

      cacheWarmer.registerStrategy('users', successFn);
      cacheWarmer.registerStrategy('schedules', failFn);

      await cacheWarmer.warmUpAll();

      expect(successFn).toHaveBeenCalledTimes(1);
      expect(failFn).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('warmUpStrategy', () => {
    it('should warm up specific registered strategy', async () => {
      const fetchFn = jest.fn().mockResolvedValue([
        { key: 'user:1', value: { id: 1 }, ttl: 300 },
      ]);

      mockCacheManager.set.mockResolvedValue(undefined);

      cacheWarmer.registerStrategy('users', fetchFn);
      await cacheWarmer.warmUpStrategy('users');

      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.set).toHaveBeenCalledTimes(1);
    });

    it('should throw error for unregistered strategy', async () => {
      await expect(cacheWarmer.warmUpStrategy('nonexistent')).rejects.toThrow(
        'Strategy "nonexistent" not found'
      );
    });
  });

  describe('clearStrategy', () => {
    it('should remove a registered strategy', () => {
      const fetchFn = jest.fn().mockResolvedValue([]);

      cacheWarmer.registerStrategy('users', fetchFn);
      expect(cacheWarmer.hasStrategy('users')).toBe(true);

      cacheWarmer.clearStrategy('users');
      expect(cacheWarmer.hasStrategy('users')).toBe(false);
    });

    it('should not throw error for non-existent strategy', () => {
      expect(() => cacheWarmer.clearStrategy('nonexistent')).not.toThrow();
    });
  });

  describe('clearAllStrategies', () => {
    it('should remove all registered strategies', () => {
      const fetchFn = jest.fn().mockResolvedValue([]);

      cacheWarmer.registerStrategy('users', fetchFn);
      cacheWarmer.registerStrategy('schedules', fetchFn);

      expect(cacheWarmer.hasStrategy('users')).toBe(true);
      expect(cacheWarmer.hasStrategy('schedules')).toBe(true);

      cacheWarmer.clearAllStrategies();

      expect(cacheWarmer.hasStrategy('users')).toBe(false);
      expect(cacheWarmer.hasStrategy('schedules')).toBe(false);
    });
  });
});
