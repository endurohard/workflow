# @workflow/cache

Shared Redis caching utilities for workflow microservices. This library provides a comprehensive caching solution with connection pooling, cache-aside pattern, cache warming, monitoring, and statistics.

## Features

- **Connection Pooling**: Automatic reconnection with configurable retry strategies
- **Cache-Aside Pattern**: Efficient caching with `getOrSet` method
- **Cache Warming**: Pre-load frequently accessed data
- **TTL Management**: Flexible expiration policies
- **Cache Invalidation**: Pattern-based and key-based invalidation
- **Statistics & Monitoring**: Track cache hits/misses and Redis metrics
- **Health Checks**: Monitor Redis connection health
- **TypeScript Support**: Full type safety and IntelliSense

## Installation

```bash
npm install
```

## Quick Start

```typescript
import { RedisClient, CacheManager, CacheWarmer, CacheMonitor } from '@workflow/cache';

// 1. Create Redis client
const redisClient = new RedisClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

// Connect to Redis
await redisClient.connect();

// 2. Create cache manager
const cacheManager = new CacheManager(redisClient.getClient(), {
  prefix: 'myapp',
  defaultTTL: 3600, // 1 hour
});

// 3. Use caching
// Simple get/set
await cacheManager.set('user:123', { id: 123, name: 'John' }, 300);
const user = await cacheManager.get('user:123');

// Cache-aside pattern
const userData = await cacheManager.getOrSet(
  'user:456',
  async () => {
    // This function only runs on cache miss
    return await fetchUserFromDatabase(456);
  },
  600 // TTL in seconds
);
```

## Core Components

### RedisClient

Manages Redis connection with automatic reconnection.

```typescript
const redisClient = new RedisClient({
  host: 'localhost',
  port: 6379,
  password: 'secret', // Optional
  db: 0, // Database number
  maxRetriesPerRequest: 10, // Max reconnection attempts
  retryDelayMs: 1000, // Delay between retries
});

await redisClient.connect();

// Health check
const health = await redisClient.healthCheck();
console.log(health.status); // 'healthy' | 'unhealthy'
console.log(health.latency); // Ping latency in ms

// Disconnect
await redisClient.disconnect();
```

### CacheManager

High-level caching operations with statistics.

```typescript
const cacheManager = new CacheManager(redisClient.getClient(), {
  prefix: 'myapp', // Key prefix for namespacing
  defaultTTL: 3600, // Default TTL in seconds
});

// Basic operations
await cacheManager.set('key', { data: 'value' }, 300);
const value = await cacheManager.get('key');
await cacheManager.del('key');

// Check existence
const exists = await cacheManager.exists('key');

// TTL management
await cacheManager.expire('key', 600); // Set TTL to 600 seconds
const ttl = await cacheManager.ttl('key'); // Get remaining TTL

// Pattern-based invalidation
await cacheManager.invalidatePattern('user:*'); // Delete all user keys

// Multiple operations
await cacheManager.mSet([
  { key: 'key1', value: { id: 1 }, ttl: 300 },
  { key: 'key2', value: { id: 2 }, ttl: 300 },
]);
const values = await cacheManager.mGet(['key1', 'key2']);

// Cache-aside pattern
const data = await cacheManager.getOrSet(
  'expensive-query',
  async () => {
    // Only called on cache miss
    return await expensiveOperation();
  },
  3600
);

// Counters
await cacheManager.increment('page-views', 1);
await cacheManager.decrement('remaining-quota', 1);

// Statistics
const stats = cacheManager.getStatistics();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
```

### CacheWarmer

Pre-load cache with frequently accessed data.

```typescript
const cacheWarmer = new CacheWarmer(cacheManager);

// Define warming strategy
cacheWarmer.registerStrategy('users', async () => {
  const users = await fetchActiveUsers();
  return users.map(user => ({
    key: `user:${user.id}`,
    value: user,
    ttl: 3600,
  }));
});

cacheWarmer.registerStrategy('schedules', async () => {
  const schedules = await fetchTodaySchedules();
  return schedules.map(schedule => ({
    key: `schedule:${schedule.id}`,
    value: schedule,
    ttl: 1800,
  }));
});

// Warm up specific strategy
await cacheWarmer.warmUpStrategy('users');

// Warm up all registered strategies
await cacheWarmer.warmUpAll();
```

### CacheMonitor

Monitor Redis health and performance.

```typescript
const cacheMonitor = new CacheMonitor(redisClient, cacheManager);

// Get memory information
const memory = await cacheMonitor.getMemoryInfo();
console.log(memory.used_memory_human);

// Get Redis statistics
const stats = await cacheMonitor.getStats();
console.log(stats.total_commands_processed);

// Get keyspace info
const keyspace = await cacheMonitor.getKeyspaceInfo();

// Get key count
const keyCount = await cacheMonitor.getKeyCount();

// Get comprehensive metrics
const metrics = await cacheMonitor.getFullMetrics();
console.log(JSON.stringify(metrics, null, 2));
```

## Caching Patterns

### 1. Cache-Aside (Lazy Loading)

Most common pattern - load data on demand:

```typescript
async function getUserProfile(userId: string) {
  return await cacheManager.getOrSet(
    `user:${userId}`,
    async () => {
      // Fetch from database only on cache miss
      return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    },
    3600 // Cache for 1 hour
  );
}
```

### 2. Write-Through

Update cache when writing to database:

```typescript
async function updateUser(userId: string, data: UserData) {
  // Update database
  await db.query('UPDATE users SET ... WHERE id = $1', [userId]);

  // Update cache
  await cacheManager.set(`user:${userId}`, data, 3600);

  return data;
}
```

### 3. Cache Invalidation

Invalidate cache when data changes:

```typescript
async function deleteUser(userId: string) {
  // Delete from database
  await db.query('DELETE FROM users WHERE id = $1', [userId]);

  // Invalidate cache
  await cacheManager.del(`user:${userId}`);

  // Invalidate related caches
  await cacheManager.invalidatePattern(`user:${userId}:*`);
}
```

### 4. Cache Warming

Pre-load frequently accessed data:

```typescript
// On application startup
cacheWarmer.registerStrategy('popular-users', async () => {
  const users = await db.query('SELECT * FROM users WHERE role = $1', ['technician']);
  return users.map(user => ({
    key: `user:${user.id}`,
    value: user,
    ttl: 3600,
  }));
});

await cacheWarmer.warmUpAll();
```

## TTL Strategies

```typescript
// No expiration (persistent)
await cacheManager.set('config', data, 0);

// Short TTL for frequently changing data (5 minutes)
await cacheManager.set('live-orders', data, 300);

// Medium TTL for semi-static data (1 hour)
await cacheManager.set('user-profile', data, 3600);

// Long TTL for rarely changing data (24 hours)
await cacheManager.set('system-config', data, 86400);
```

## Integration with Microservices

### Users Service Example

```typescript
// services/users/src/cache.ts
import { RedisClient, CacheManager } from '@workflow/cache';

const redisClient = new RedisClient({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

await redisClient.connect();

export const userCache = new CacheManager(redisClient.getClient(), {
  prefix: 'users',
  defaultTTL: 3600,
});

// services/users/src/controllers/users.controller.ts
import { userCache } from '../cache';

export async function getUser(req, res) {
  const userId = req.params.id;

  const user = await userCache.getOrSet(
    `profile:${userId}`,
    async () => {
      return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    },
    3600
  );

  res.json(user);
}
```

### Schedule Service Example

```typescript
// services/schedule/src/cache.ts
import { RedisClient, CacheManager, CacheWarmer } from '@workflow/cache';

const redisClient = new RedisClient({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

await redisClient.connect();

export const scheduleCache = new CacheManager(redisClient.getClient(), {
  prefix: 'schedules',
  defaultTTL: 1800, // 30 minutes
});

export const scheduleWarmer = new CacheWarmer(scheduleCache);

// Warm up today's schedules
scheduleWarmer.registerStrategy('today', async () => {
  const schedules = await db.query('SELECT * FROM schedules WHERE date = CURRENT_DATE');
  return schedules.map(schedule => ({
    key: `technician:${schedule.technician_id}:${schedule.date}`,
    value: schedule,
    ttl: 1800,
  }));
});
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

## Best Practices

1. **Use appropriate TTLs**: Match TTL to data change frequency
2. **Namespace keys**: Use prefixes to organize cache keys
3. **Handle cache misses gracefully**: Always have a fallback
4. **Monitor cache performance**: Track hit rates and adjust strategies
5. **Invalidate on updates**: Keep cache consistent with database
6. **Warm critical data**: Pre-load frequently accessed data on startup
7. **Use pattern invalidation carefully**: Can be expensive for large keyspaces
8. **Set memory limits**: Configure Redis maxmemory and eviction policies

## Performance Tips

- Use `mGet`/`mSet` for batch operations
- Prefer `getOrSet` for cache-aside pattern
- Use counters (`increment`/`decrement`) for high-frequency updates
- Monitor hit rates and adjust TTLs accordingly
- Use connection pooling for high-concurrency scenarios

## License

MIT
