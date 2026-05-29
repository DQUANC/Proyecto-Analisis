import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(authMiddleware, requireRole('ADMIN'));

router.get('/summary', dashboardController.summary);
router.get('/by-department', dashboardController.byDepartment);
router.get('/by-user', dashboardController.byUser);

export default router;
