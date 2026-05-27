import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';

export async function summary(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getSummary();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function byDepartment(_req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await dashboardService.getByDepartment();
    res.json({ departments });
  } catch (err) {
    next(err);
  }
}

export async function byUser(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await dashboardService.getByUser();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}
