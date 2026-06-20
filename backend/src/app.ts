process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import tasksRoutes from './routes/tasks.routes';
import departmentsRoutes from './routes/departments.routes';
import dashboardRoutes from './routes/dashboard.routes';
import usersRoutes from './routes/users.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { initDisabledUsersTable } from './services/users.service';

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
app.use('/api/users', usersRoutes);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT ?? 3000);
initDisabledUsersTable()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => { console.error('DB init error:', err); process.exit(1); });

export default app;
