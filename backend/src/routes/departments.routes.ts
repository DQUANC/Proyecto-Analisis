import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole, requireSuperUser } from '../middleware/role.middleware';
import * as deptController from '../controllers/departments.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('ADMIN'), deptController.getAll);
router.post('/', requireSuperUser, deptController.create);
router.put('/:id', requireSuperUser, deptController.update);
router.delete('/:id', requireSuperUser, deptController.remove);

export default router;
