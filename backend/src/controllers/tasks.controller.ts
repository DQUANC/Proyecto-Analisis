import { Request, Response, NextFunction } from 'express';
import { TaskStatus } from '@prisma/client';
import * as tasksService from '../services/tasks.service';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, departmentId, assignedToId, page, limit } = req.query as Record<string, string>;
    const result = await tasksService.getTasks(req.user!, {
      status: status as TaskStatus | undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      assignedToId: assignedToId ? Number(assignedToId) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.getTaskById(Number(req.params.id), req.user!);
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.createTask(
      req.body as { title: string; description?: string; priority?: string; dueDate?: string; departmentId: number; assignedToId?: number },
      req.user!.id
    );
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.updateTask(Number(req.params.id), req.body as Partial<{ title: string; description: string; status: TaskStatus; priority: string; dueDate: string; assignedToId: number }>, req.user!);
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.isSuperUser) {
      res.status(403).json({ message: 'Solo el Super Usuario puede eliminar tareas.' });
      return;
    }
    await tasksService.deleteTask(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { departmentId, assignedToId, dateFrom, dateTo } = req.query as Record<string, string>;
    const tasks = await tasksService.getHistory(req.user!, {
      departmentId: departmentId ? Number(departmentId) : undefined,
      assignedToId: assignedToId ? Number(assignedToId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

export async function getStatusHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await tasksService.getTaskStatusHistory(Number(req.params.id), req.user!);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const evaluation = await tasksService.evaluateTask(
      Number(req.params.id),
      req.body as { feedback?: string; score?: number },
      req.user!.id
    );
    res.json({ evaluation });
  } catch (err) {
    next(err);
  }
}
