import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getAll, getById, create, update, remove } from '../controllers/tasks.controller';

export const taskRoutes = Router();

taskRoutes.use(authMiddleware);

taskRoutes.get('/', getAll);
taskRoutes.post('/', create);
taskRoutes.get('/:id', getById);
taskRoutes.put('/:id', update);
taskRoutes.delete('/:id', remove);
