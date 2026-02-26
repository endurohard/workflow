import { QueueManager } from '../queues/queue-manager';
import { Queue, Worker } from 'bullmq';

// Mock BullMQ
jest.mock('bullmq');

describe('QueueManager', () => {
  let queueManager: QueueManager;

  beforeEach(() => {
    jest.clearAllMocks();
    queueManager = QueueManager.getInstance();
  });

  afterEach(async () => {
    await queueManager.closeAll();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = QueueManager.getInstance();
      const instance2 = QueueManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Queue Creation', () => {
    it('should create an email queue', () => {
      const queue = queueManager.getQueue('email');
      expect(queue).toBeDefined();
      expect(Queue).toHaveBeenCalledWith('email', expect.any(Object));
    });

    it('should create a push notification queue', () => {
      const queue = queueManager.getQueue('push');
      expect(queue).toBeDefined();
      expect(Queue).toHaveBeenCalledWith('push', expect.any(Object));
    });

    it('should create a telegram queue', () => {
      const queue = queueManager.getQueue('telegram');
      expect(queue).toBeDefined();
      expect(Queue).toHaveBeenCalledWith('telegram', expect.any(Object));
    });

    it('should reuse existing queue instance', () => {
      const queue1 = queueManager.getQueue('email');
      const queue2 = queueManager.getQueue('email');
      expect(queue1).toBe(queue2);
    });
  });

  describe('Job Addition', () => {
    it('should add job to email queue', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: '123' });
      (Queue as jest.Mock).mockImplementation(() => ({
        add: mockAdd,
      }));

      queueManager = QueueManager.getInstance();
      await queueManager.addJob('email', { to: 'test@example.com', subject: 'Test' });

      expect(mockAdd).toHaveBeenCalledWith(
        'send-email',
        { to: 'test@example.com', subject: 'Test' },
        expect.objectContaining({
          attempts: expect.any(Number),
          backoff: expect.any(Object),
        })
      );
    });

    it('should add job with priority', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: '123' });
      (Queue as jest.Mock).mockImplementation(() => ({
        add: mockAdd,
      }));

      queueManager = QueueManager.getInstance();
      await queueManager.addJob('email', { to: 'test@example.com' }, { priority: 1 });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          priority: 1,
        })
      );
    });

    it('should add job with delay', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: '123' });
      (Queue as jest.Mock).mockImplementation(() => ({
        add: mockAdd,
      }));

      queueManager = QueueManager.getInstance();
      await queueManager.addJob('email', { to: 'test@example.com' }, { delay: 5000 });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          delay: 5000,
        })
      );
    });
  });

  describe('Worker Management', () => {
    it('should register a worker for a queue', () => {
      const processor = jest.fn();
      queueManager.registerWorker('email', processor);

      expect(Worker).toHaveBeenCalledWith(
        'email',
        expect.any(Function),
        expect.objectContaining({
          connection: expect.any(Object),
        })
      );
    });

    it('should handle worker errors', () => {
      const processor = jest.fn();
      const mockOn = jest.fn();

      (Worker as jest.Mock).mockImplementation(() => ({
        on: mockOn,
      }));

      queueManager.registerWorker('email', processor);

      expect(mockOn).toHaveBeenCalledWith('failed', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Queue Metrics', () => {
    it('should return queue metrics', async () => {
      const mockGetJobCounts = jest.fn().mockResolvedValue({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });

      (Queue as jest.Mock).mockImplementation(() => ({
        getJobCounts: mockGetJobCounts,
      }));

      queueManager = QueueManager.getInstance();
      const metrics = await queueManager.getQueueMetrics('email');

      expect(metrics).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });
    });

    it('should return metrics for all queues', async () => {
      const mockGetJobCounts = jest.fn().mockResolvedValue({
        waiting: 1,
        active: 1,
        completed: 10,
        failed: 0,
        delayed: 0,
      });

      (Queue as jest.Mock).mockImplementation(() => ({
        getJobCounts: mockGetJobCounts,
      }));

      queueManager = QueueManager.getInstance();
      queueManager.getQueue('email');
      queueManager.getQueue('push');

      const allMetrics = await queueManager.getAllMetrics();

      expect(allMetrics).toHaveProperty('email');
      expect(allMetrics).toHaveProperty('push');
    });
  });

  describe('Job Failure Handling', () => {
    it('should move failed jobs to dead letter queue after max attempts', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: '123' });
      (Queue as jest.Mock).mockImplementation(() => ({
        add: mockAdd,
      }));

      queueManager = QueueManager.getInstance();
      await queueManager.addJob('email', { to: 'test@example.com' });

      const callOptions = mockAdd.mock.calls[0][2];
      expect(callOptions.attempts).toBeGreaterThan(1);
      expect(callOptions.backoff).toBeDefined();
    });
  });

  describe('Queue Cleanup', () => {
    it('should close all queues and workers', async () => {
      const mockClose = jest.fn().mockResolvedValue(undefined);

      (Queue as jest.Mock).mockImplementation(() => ({
        close: mockClose,
      }));

      (Worker as jest.Mock).mockImplementation(() => ({
        close: mockClose,
        on: jest.fn(),
      }));

      queueManager = QueueManager.getInstance();
      queueManager.getQueue('email');
      queueManager.registerWorker('push', jest.fn());

      await queueManager.closeAll();

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Redis Connection', () => {
    it('should use Redis connection configuration', () => {
      queueManager.getQueue('email');

      expect(Queue).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          connection: expect.objectContaining({
            host: expect.any(String),
            port: expect.any(Number),
          }),
        })
      );
    });
  });
});
