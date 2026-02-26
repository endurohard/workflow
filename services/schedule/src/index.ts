import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'schedule-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/schedule', (req: Request, res: Response) => {
  res.json({ schedule: [] });
});

app.get('/api/schedule/technician/:id', (req: Request, res: Response) => {
  res.json({ schedule: [] });
});

app.post('/api/schedule', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Schedule entry created' });
});

app.get('/api/calendar', (req: Request, res: Response) => {
  res.json({ events: [] });
});

app.listen(PORT, () => {
  console.log(`Schedule Service running on port ${PORT}`);
});
