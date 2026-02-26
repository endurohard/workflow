import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'tasks-service',
    timestamp: new Date().toISOString()
  });
});

// Tasks endpoints
app.get('/api/tasks', (req: Request, res: Response) => {
  res.json({ tasks: [] });
});

app.get('/api/tasks/:id', (req: Request, res: Response) => {
  res.json({ task: { id: req.params.id } });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Task created' });
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  res.json({ message: 'Task updated' });
});

app.patch('/api/tasks/:id/status', (req: Request, res: Response) => {
  res.json({ message: 'Task status updated' });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  res.json({ message: 'Task deleted' });
});

// Orders endpoints
app.get('/api/orders', (req: Request, res: Response) => {
  res.json({ orders: [] });
});

app.post('/api/orders', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Order created' });
});

app.listen(PORT, () => {
  console.log(`Tasks Service running on port ${PORT}`);
});
