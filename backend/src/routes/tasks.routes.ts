import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import * as tasksController from '../controllers/tasks.controller';

const router = Router();

router.use(authMiddleware);

router.get('/history', tasksController.getHistory);
router.get('/', tasksController.getAll);
router.get('/:id/history', tasksController.getStatusHistory);
router.get('/:id', tasksController.getById);
router.post('/', requireRole('ADMIN'), tasksController.create);
router.put('/:id', tasksController.update);
router.delete('/:id', requireRole('ADMIN'), tasksController.remove);
router.post('/:id/evaluate', requireRole('ADMIN'), tasksController.evaluate);

export default router;
