import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused?: number;
}

export type QueueName = 'email' | 'push' | 'telegram' | 'report' | 'dead-letter';

export class QueueManager {
  private static instance: QueueManager;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private connection: Redis;

  private constructor() {
    // Initialize Redis connection
    this.connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * Get or create a queue
   */
  public getQueue(queueName: QueueName): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
        },
      });

      this.queues.set(queueName, queue);
    }

    return this.queues.get(queueName)!;
  }

  /**
   * Add a job to a queue
   */
  public async addJob(
    queueName: QueueName,
    data: any,
    options?: JobOptions
  ): Promise<Job> {
    const queue = this.getQueue(queueName);

    const jobOptions = {
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential' as const,
        delay: 5000,
      },
      priority: options?.priority,
      delay: options?.delay,
      removeOnComplete: options?.removeOnComplete !== undefined ? options.removeOnComplete : 100,
      removeOnFail: options?.removeOnFail !== undefined ? options.removeOnFail : 500,
    };

    // Determine job name based on queue type
    let jobName = 'process';
    switch (queueName) {
      case 'email':
        jobName = 'send-email';
        break;
      case 'push':
        jobName = 'send-push';
        break;
      case 'telegram':
        jobName = 'send-telegram';
        break;
      case 'report':
        jobName = 'generate-report';
        break;
    }

    return await queue.add(jobName, data, jobOptions);
  }

  /**
   * Register a worker for a queue
   */
  public registerWorker(
    queueName: QueueName,
    processor: (job: Job) => Promise<any>,
    options?: Partial<WorkerOptions>
  ): Worker {
    if (this.workers.has(queueName)) {
      console.warn(`Worker for queue ${queueName} already exists`);
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(
      queueName,
      processor,
      {
        connection: this.connection,
        concurrency: options?.concurrency || 5,
        ...options,
      }
    );

    // Handle worker events
    worker.on('completed', (job: Job) => {
      console.log(`Job ${job.id} in queue ${queueName} completed successfully`);
    });

    worker.on('failed', async (job: Job | undefined, err: Error) => {
      console.error(`Job ${job?.id} in queue ${queueName} failed:`, err.message);

      // Move to dead letter queue if max attempts reached
      if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
        await this.moveToDeadLetterQueue(job, err);
      }
    });

    worker.on('error', (err: Error) => {
      console.error(`Worker error in queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  /**
   * Get metrics for a specific queue
   */
  public async getQueueMetrics(queueName: QueueName): Promise<QueueMetrics> {
    const queue = this.getQueue(queueName);
    const counts = await queue.getJobCounts();

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0,
    };
  }

  /**
   * Get metrics for all queues
   */
  public async getAllMetrics(): Promise<Record<string, QueueMetrics>> {
    const metrics: Record<string, QueueMetrics> = {};

    for (const [queueName, queue] of this.queues.entries()) {
      const counts = await queue.getJobCounts();
      metrics[queueName] = {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        paused: counts.paused || 0,
      };
    }

    return metrics;
  }

  /**
   * Move failed job to dead letter queue
   */
  private async moveToDeadLetterQueue(job: Job, error: Error): Promise<void> {
    try {
      const deadLetterQueue = this.getQueue('dead-letter');
      await deadLetterQueue.add('failed-job', {
        originalQueue: job.queueName,
        originalJobId: job.id,
        originalData: job.data,
        error: error.message,
        failedAt: new Date().toISOString(),
        attempts: job.attemptsMade,
      });

      console.log(`Job ${job.id} moved to dead letter queue`);
    } catch (err) {
      console.error('Failed to move job to dead letter queue:', err);
    }
  }

  /**
   * Pause a queue
   */
  public async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    console.log(`Queue ${queueName} paused`);
  }

  /**
   * Resume a queue
   */
  public async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    console.log(`Queue ${queueName} resumed`);
  }

  /**
   * Clean old jobs from a queue
   */
  public async cleanQueue(
    queueName: QueueName,
    grace: number = 24 * 3600 * 1000, // 24 hours
    limit: number = 1000,
    type: 'completed' | 'failed' = 'completed'
  ): Promise<string[]> {
    const queue = this.getQueue(queueName);
    return await queue.clean(grace, limit, type);
  }

  /**
   * Close all queues and workers
   */
  public async closeAll(): Promise<void> {
    // Close all workers first
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      console.log(`Worker ${name} closed`);
    }

    // Close all queues
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      console.log(`Queue ${name} closed`);
    }

    // Close Redis connection
    await this.connection.quit();

    // Clear maps
    this.workers.clear();
    this.queues.clear();
  }

  /**
   * Get a specific job by ID
   */
  public async getJob(queueName: QueueName, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  /**
   * Retry a failed job
   */
  public async retryJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      console.log(`Job ${jobId} in queue ${queueName} retried`);
    }
  }

  /**
   * Remove a job
   */
  public async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      console.log(`Job ${jobId} in queue ${queueName} removed`);
    }
  }
}

export default QueueManager.getInstance();
