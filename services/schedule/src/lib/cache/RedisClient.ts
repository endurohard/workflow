import { createClient, RedisClientType } from 'redis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayMs?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  connected: boolean;
  error?: string;
  latency?: number;
}

/**
 * RedisClient - Manages Redis connection with automatic reconnection
 * Provides connection pooling and health check capabilities
 */
export class RedisClient {
  private client: RedisClientType;
  private isConnecting = false;
  private config: RedisConfig;

  constructor(config: RedisConfig) {
    this.config = config;

    this.client = createClient({
      socket: {
        host: config.host,
        port: config.port,
        reconnectStrategy: (retries: number) => {
          const delay = config.retryDelayMs || 1000;
          const maxRetries = config.maxRetriesPerRequest || 10;

          if (retries > maxRetries) {
            console.error(`Redis: Max reconnection attempts (${maxRetries}) reached`);
            return new Error('Max reconnection attempts reached');
          }

          console.log(`Redis: Reconnecting... Attempt ${retries}`);
          return Math.min(delay * retries, 3000);
        },
      },
      password: config.password,
      database: config.db || 0,
    }) as RedisClientType;

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for Redis client
   */
  private setupEventHandlers(): void {
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis: Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis: Ready to accept commands');
    });

    this.client.on('reconnecting', () => {
      console.log('Redis: Reconnecting...');
    });

    this.client.on('end', () => {
      console.log('Redis: Connection closed');
    });
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    if (this.isConnected() || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      await this.client.connect();
      console.log(`Redis: Successfully connected to ${this.config.host}:${this.config.port}`);
    } catch (error) {
      console.error('Redis: Failed to connect:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from Redis server
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      console.log('Redis: Disconnected successfully');
    } catch (error) {
      console.error('Redis: Error during disconnect:', error);
    }
  }

  /**
   * Get the underlying Redis client instance
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Check if Redis client is connected
   */
  isConnected(): boolean {
    return this.client?.isOpen || false;
  }

  /**
   * Perform health check on Redis connection
   */
  async healthCheck(): Promise<HealthStatus> {
    if (!this.isConnected()) {
      return {
        status: 'unhealthy',
        connected: false,
        error: 'Not connected',
      };
    }

    try {
      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        connected: true,
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
