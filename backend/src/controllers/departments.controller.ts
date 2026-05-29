import { Request, Response, NextFunction } from 'express';
import * as deptService from '../services/departments.service';

export async function getAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await deptService.getAll();
    res.json({ departments });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dept = await deptService.create((req.body as { name: string }).name);
    res.status(201).json({ department: dept });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dept = await deptService.update(Number(req.params.id), (req.body as { name: string }).name);
    res.json({ department: dept });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deptService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
