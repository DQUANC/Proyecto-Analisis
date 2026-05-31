import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import tasksRoutes from './routes/tasks.routes';
import departmentsRoutes from './routes/departments.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.railway.app')) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
