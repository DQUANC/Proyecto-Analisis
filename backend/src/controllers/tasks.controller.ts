import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/tasks.service';

const taskService = new TaskService();

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).userId as number;
    const tasks = await taskService.getAll(userId);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).userId as number;
    const task = await taskService.getById(Number(req.params.id), userId);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).userId as number;
    const task = await taskService.create(req.body, userId);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).userId as number;
    const task = await taskService.update(Number(req.params.id), req.body, userId);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).userId as number;
    await taskService.remove(Number(req.params.id), userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
