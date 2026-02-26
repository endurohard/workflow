import { CacheManager, CacheEntry } from './CacheManager';

export type WarmingStrategy = () => Promise<CacheEntry[]>;

/**
 * CacheWarmer - Implements cache warming strategies
 * Allows pre-loading cache with frequently accessed data
 */
export class CacheWarmer {
  private cacheManager: CacheManager;
  private strategies: Map<string, WarmingStrategy> = new Map();

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  /**
   * Warm up cache with data from a strategy
   */
  async warmUp(strategyName: string, fetchFn: WarmingStrategy): Promise<void> {
    try {
      console.log(`Cache warming started: ${strategyName}`);
      const entries = await fetchFn();

      for (const entry of entries) {
        if (!entry.key) {
          console.warn(`Skipping entry without key in strategy ${strategyName}`);
          continue;
        }

        await this.cacheManager.set(entry.key, entry.value, entry.ttl);
      }

      console.log(`Cache warming completed: ${strategyName} (${entries.length} entries)`);
    } catch (error) {
      console.error(`Cache warming failed for ${strategyName}:`, error);
      throw error;
    }
  }

  /**
   * Register a warming strategy
   */
  registerStrategy(name: string, strategy: WarmingStrategy): void {
    this.strategies.set(name, strategy);
    console.log(`Cache warming strategy registered: ${name}`);
  }

  /**
   * Check if a strategy is registered
   */
  hasStrategy(name: string): boolean {
    return this.strategies.has(name);
  }

  /**
   * Warm up all registered strategies
   */
  async warmUpAll(): Promise<void> {
    console.log(`Warming up ${this.strategies.size} cache strategies...`);

    const promises = Array.from(this.strategies.entries()).map(async ([name, strategy]) => {
      try {
        await this.warmUp(name, strategy);
      } catch (error) {
        console.error(`Failed to warm up strategy ${name}:`, error);
        // Continue with other strategies even if one fails
      }
    });

    await Promise.all(promises);
    console.log('All cache warming strategies completed');
  }

  /**
   * Warm up a specific registered strategy
   */
  async warmUpStrategy(name: string): Promise<void> {
    const strategy = this.strategies.get(name);

    if (!strategy) {
      throw new Error(`Strategy "${name}" not found`);
    }

    await this.warmUp(name, strategy);
  }

  /**
   * Clear a registered strategy
   */
  clearStrategy(name: string): void {
    this.strategies.delete(name);
  }

  /**
   * Clear all registered strategies
   */
  clearAllStrategies(): void {
    this.strategies.clear();
  }
}
