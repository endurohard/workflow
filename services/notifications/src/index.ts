import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import queueManager from './queues/queue-manager';
import { EmailWorker } from './workers/email-worker';
import { PushWorker } from './workers/push-worker';
import { TelegramWorker } from './workers/telegram-worker';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize workers
const emailWorker = new EmailWorker();
const pushWorker = new PushWorker();
const telegramWorker = new TelegramWorker();

// Register queue workers
queueManager.registerWorker('email', async (job) => {
  return await emailWorker.process(job);
});

queueManager.registerWorker('push', async (job) => {
  return await pushWorker.process(job);
});

queueManager.registerWorker('telegram', async (job) => {
  return await telegramWorker.process(job);
});

console.log('Queue workers registered successfully');

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notifications-service',
    timestamp: new Date().toISOString(),
  });
});

// Send email notification
app.post('/api/notifications/email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, subject, body, html, cc, bcc, attachments, priority, delay } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, body',
      });
    }

    const job = await queueManager.addJob(
      'email',
      { to, subject, body, html, cc, bcc, attachments },
      { priority, delay }
    );

    res.status(202).json({
      message: 'Email notification queued successfully',
      jobId: job.id,
      queue: 'email',
    });
  } catch (error) {
    next(error);
  }
});

// Send push notification
app.post('/api/notifications/push', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, tokens, topic, condition, title, body, data, imageUrl, android, apns, priority, delay } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: title, body',
      });
    }

    if (!token && !tokens && !topic && !condition) {
      return res.status(400).json({
        error: 'Missing target: token, tokens, topic, or condition',
      });
    }

    const job = await queueManager.addJob(
      'push',
      { token, tokens, topic, condition, title, body, data, imageUrl, android, apns },
      { priority, delay }
    );

    res.status(202).json({
      message: 'Push notification queued successfully',
      jobId: job.id,
      queue: 'push',
    });
  } catch (error) {
    next(error);
  }
});

// Send Telegram notification
app.post('/api/notifications/telegram', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      chatId,
      chatIds,
      text,
      parseMode,
      type,
      photo,
      document,
      caption,
      keyboard,
      replyToMessageId,
      disableWebPagePreview,
      disableNotification,
      priority,
      delay,
    } = req.body;

    if (!text && type === 'text') {
      return res.status(400).json({
        error: 'Missing required field: text',
      });
    }

    if (!chatId && !chatIds) {
      return res.status(400).json({
        error: 'Missing required field: chatId or chatIds',
      });
    }

    const job = await queueManager.addJob(
      'telegram',
      {
        chatId,
        chatIds,
        text,
        parseMode,
        type,
        photo,
        document,
        caption,
        keyboard,
        replyToMessageId,
        disableWebPagePreview,
        disableNotification,
      },
      { priority, delay }
    );

    res.status(202).json({
      message: 'Telegram notification queued successfully',
      jobId: job.id,
      queue: 'telegram',
    });
  } catch (error) {
    next(error);
  }
});

// Queue monitoring dashboard
app.get('/api/queue/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await queueManager.getAllMetrics();

    res.json({
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    next(error);
  }
});

// Get metrics for a specific queue
app.get('/api/queue/:queueName/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params;

    if (!['email', 'push', 'telegram', 'report', 'dead-letter'].includes(queueName)) {
      return res.status(400).json({
        error: 'Invalid queue name',
      });
    }

    const metrics = await queueManager.getQueueMetrics(queueName as any);

    res.json({
      queue: queueName,
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    next(error);
  }
});

// Get job status
app.get('/api/queue/:queueName/jobs/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName, jobId } = req.params;

    if (!['email', 'push', 'telegram', 'report', 'dead-letter'].includes(queueName)) {
      return res.status(400).json({
        error: 'Invalid queue name',
      });
    }

    const job = await queueManager.getJob(queueName as any, jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
      });
    }

    res.json({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      returnvalue: job.returnvalue,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    });
  } catch (error) {
    next(error);
  }
});

// Retry a failed job
app.post('/api/queue/:queueName/jobs/:jobId/retry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName, jobId } = req.params;

    if (!['email', 'push', 'telegram', 'report', 'dead-letter'].includes(queueName)) {
      return res.status(400).json({
        error: 'Invalid queue name',
      });
    }

    await queueManager.retryJob(queueName as any, jobId);

    res.json({
      message: 'Job retry initiated',
      queue: queueName,
      jobId,
    });
  } catch (error) {
    next(error);
  }
});

// Pause a queue
app.post('/api/queue/:queueName/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params;

    if (!['email', 'push', 'telegram', 'report'].includes(queueName)) {
      return res.status(400).json({
        error: 'Invalid queue name',
      });
    }

    await queueManager.pauseQueue(queueName as any);

    res.json({
      message: `Queue ${queueName} paused`,
    });
  } catch (error) {
    next(error);
  }
});

// Resume a queue
app.post('/api/queue/:queueName/resume', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params;

    if (!['email', 'push', 'telegram', 'report'].includes(queueName)) {
      return res.status(400).json({
        error: 'Invalid queue name',
      });
    }

    await queueManager.resumeQueue(queueName as any);

    res.json({
      message: `Queue ${queueName} resumed`,
    });
  } catch (error) {
    next(error);
  }
});

// Clean old jobs from a queue
app.post('/api/queue/:queueName/clean', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params;
    const { grace, limit, type } = req.body;

    if (!['email', 'push', 'telegram', 'report'].includes(queueName)) {
      return res.status(400).json({
        error: 'Invalid queue name',
      });
    }

    const cleaned = await queueManager.cleanQueue(queueName as any, grace, limit, type);

    res.json({
      message: `Cleaned ${cleaned.length} jobs from queue ${queueName}`,
      cleanedJobIds: cleaned,
    });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');

  try {
    await queueManager.closeAll();
    console.log('All queues and workers closed');

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.listen(PORT, () => {
  console.log(`Notifications Service running on port ${PORT}`);
  console.log(`Queue monitoring available at http://localhost:${PORT}/api/queue/metrics`);
});
