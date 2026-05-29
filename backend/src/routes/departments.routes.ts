import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import * as deptController from '../controllers/departments.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', deptController.getAll);
router.post('/', requireRole('ADMIN'), deptController.create);
router.put('/:id', requireRole('ADMIN'), deptController.update);
router.delete('/:id', requireRole('ADMIN'), deptController.remove);

export default router;
