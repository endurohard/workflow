import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notifications-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({ notifications: [] });
});

app.post('/api/notifications', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Notification sent' });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  res.json({ message: 'Notification marked as read' });
});

app.listen(PORT, () => {
  console.log(`Notifications Service running on port ${PORT}`);
});
