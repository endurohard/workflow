# Job Queue System Documentation

## Overview

This service implements a Redis-based job queue system using BullMQ for background processing of notifications and reports. The system includes:

- **Email notifications** via SMTP
- **Push notifications** via Firebase Cloud Messaging
- **Telegram notifications** via Telegram Bot API
- **Report generation** (can be extended)
- **Dead letter queue** for failed jobs
- **Job monitoring dashboard**
- **Automatic retry logic**
- **Job prioritization**
- **Metrics and monitoring**

## Architecture

### Components

1. **Queue Manager** (`src/queues/queue-manager.ts`)
   - Singleton pattern for managing all queues
   - Handles queue creation, job addition, worker registration
   - Provides metrics and monitoring capabilities
   - Implements dead letter queue for failed jobs

2. **Workers** (`src/workers/`)
   - `email-worker.ts`: Processes email notifications
   - `push-worker.ts`: Processes push notifications
   - `telegram-worker.ts`: Processes Telegram messages

3. **Redis Connection**
   - Uses ioredis for connection management
   - Configured via environment variables
   - Shared connection across all queues

## Features

### ✅ Retry Logic
- Automatic retries with exponential backoff
- Configurable retry attempts (default: 3)
- Default backoff: 5 seconds exponential

### ✅ Job Prioritization
- Higher priority jobs processed first
- Priority range: 1 (highest) to 10 (lowest)
- Example: Critical notifications can be prioritized

### ✅ Dead Letter Queue
- Failed jobs after max retries moved to DLQ
- Preserves original job data and error information
- Can be inspected and manually retried

### ✅ Job Monitoring
- Real-time queue metrics (waiting, active, completed, failed)
- Individual job status tracking
- Queue pause/resume capabilities
- Job cleanup for completed/failed jobs

### ✅ Graceful Shutdown
- Closes all queues and workers on SIGTERM/SIGINT
- Ensures job processing completes before shutdown

## API Endpoints

### Notification Endpoints

#### Send Email
```bash
POST /api/notifications/email
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Test Email",
  "body": "Plain text body",
  "html": "<p>HTML body</p>",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "priority": 1,
  "delay": 5000
}
```

#### Send Push Notification
```bash
POST /api/notifications/push
Content-Type: application/json

{
  "token": "device-token",
  "title": "New Order",
  "body": "You have a new order",
  "data": {
    "orderId": "123",
    "type": "order_created"
  },
  "priority": 1
}
```

#### Send Telegram Message
```bash
POST /api/notifications/telegram
Content-Type: application/json

{
  "chatId": "123456789",
  "text": "Hello from Workflow!",
  "parseMode": "Markdown",
  "priority": 2
}
```

### Queue Management Endpoints

#### Get All Queue Metrics
```bash
GET /api/queue/metrics
```

Response:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metrics": {
    "email": {
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3,
      "delayed": 1
    },
    "push": { ... },
    "telegram": { ... }
  }
}
```

#### Get Specific Queue Metrics
```bash
GET /api/queue/:queueName/metrics
```

#### Get Job Status
```bash
GET /api/queue/:queueName/jobs/:jobId
```

#### Retry Failed Job
```bash
POST /api/queue/:queueName/jobs/:jobId/retry
```

#### Pause Queue
```bash
POST /api/queue/:queueName/pause
```

#### Resume Queue
```bash
POST /api/queue/:queueName/resume
```

#### Clean Old Jobs
```bash
POST /api/queue/:queueName/clean
Content-Type: application/json

{
  "grace": 86400000,
  "limit": 1000,
  "type": "completed"
}
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `REDIS_HOST`: Redis server hostname
- `REDIS_PORT`: Redis server port
- `SMTP_*`: Email configuration
- `FIREBASE_*`: Push notification configuration
- `TELEGRAM_BOT_TOKEN`: Telegram bot token

### Queue Options

Default job options (can be overridden per job):
- **attempts**: 3
- **backoff**: Exponential, 5000ms initial delay
- **removeOnComplete**: Keep last 100 completed jobs
- **removeOnFail**: Keep last 500 failed jobs

## Testing

The system includes comprehensive tests following TDD principles:

```bash
npm test                  # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

Test files:
- `src/__tests__/queue-manager.test.ts`
- `src/__tests__/email-worker.test.ts`
- `src/__tests__/push-worker.test.ts`
- `src/__tests__/telegram-worker.test.ts`

### Coverage Requirements
- Minimum 80% coverage (branches, functions, lines, statements)
- Configured in `jest.config.js`

## Usage Examples

### Adding a Job with Priority
```typescript
import queueManager from './queues/queue-manager';

// High priority email
await queueManager.addJob('email', {
  to: 'urgent@example.com',
  subject: 'Urgent',
  body: 'This is urgent'
}, { priority: 1 });

// Low priority email
await queueManager.addJob('email', {
  to: 'normal@example.com',
  subject: 'Normal',
  body: 'This is normal'
}, { priority: 5 });
```

### Adding a Delayed Job
```typescript
// Send email in 1 hour
await queueManager.addJob('email', {
  to: 'user@example.com',
  subject: 'Reminder',
  body: 'This is your reminder'
}, { delay: 3600000 }); // 1 hour in milliseconds
```

### Monitoring Queue Health
```typescript
const metrics = await queueManager.getQueueMetrics('email');
console.log(`Waiting: ${metrics.waiting}, Active: ${metrics.active}`);

if (metrics.failed > 100) {
  console.warn('High failure rate detected!');
}
```

## Extending the System

### Adding a New Queue Type

1. **Create Worker**
```typescript
// src/workers/my-worker.ts
export class MyWorker {
  async process(job: Job): Promise<any> {
    // Process job
  }
}
```

2. **Register Worker**
```typescript
// src/index.ts
const myWorker = new MyWorker();
queueManager.registerWorker('my-queue', async (job) => {
  return await myWorker.process(job);
});
```

3. **Add API Endpoint**
```typescript
app.post('/api/notifications/my-type', async (req, res) => {
  const job = await queueManager.addJob('my-queue', req.body);
  res.status(202).json({ jobId: job.id });
});
```

4. **Update QueueName Type**
```typescript
// src/queues/queue-manager.ts
export type QueueName = 'email' | 'push' | 'telegram' | 'report' | 'my-queue' | 'dead-letter';
```

## Monitoring and Observability

### Metrics Available
- **waiting**: Jobs waiting to be processed
- **active**: Jobs currently being processed
- **completed**: Total completed jobs
- **failed**: Total failed jobs
- **delayed**: Jobs scheduled for future processing
- **paused**: Jobs in paused queues

### Logging
- All job completions logged with job ID
- All failures logged with error message
- Worker errors logged separately
- Dead letter queue moves logged

### Best Practices
1. Monitor the dead letter queue regularly
2. Set up alerts for high failure rates
3. Clean old completed jobs periodically
4. Use appropriate retry counts for different job types
5. Implement idempotent job processors

## Troubleshooting

### Jobs Not Processing
1. Check Redis connection
2. Verify workers are registered
3. Check queue is not paused
4. Review worker logs for errors

### High Failure Rate
1. Check dead letter queue for patterns
2. Review error messages
3. Verify external service credentials (SMTP, Firebase, Telegram)
4. Check network connectivity

### Memory Issues
1. Clean old completed/failed jobs
2. Reduce `removeOnComplete` and `removeOnFail` limits
3. Monitor Redis memory usage

## Performance Tuning

### Worker Concurrency
```typescript
queueManager.registerWorker('email', processor, {
  concurrency: 10 // Process 10 jobs concurrently
});
```

### Job Batching
For bulk operations, add multiple jobs at once:
```typescript
const jobs = emails.map(email => ({
  name: 'send-email',
  data: email,
  opts: { priority: 2 }
}));

await queue.addBulk(jobs);
```

### Rate Limiting
Use BullMQ's rate limiter:
```typescript
const queue = new Queue('email', {
  limiter: {
    max: 100,     // Max 100 jobs
    duration: 1000 // Per 1 second
  }
});
```

## Security Considerations

1. **Credentials**: Store in environment variables, never in code
2. **Input Validation**: All API endpoints validate input
3. **Error Messages**: Don't expose sensitive info in error responses
4. **SMTP Auth**: Use app-specific passwords when possible
5. **Firebase**: Use service account with minimal permissions
6. **Telegram**: Keep bot token secret

## License

This queue system is part of the Workflow project.
