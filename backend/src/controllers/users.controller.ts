import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/users.service';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.query as Record<string, string>;
    const users = await usersService.getAll({ role });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getById(Number(req.params.id));
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.create(
      req.body as { name: string; email: string; password: string; role?: 'ADMIN' | 'WORKER'; departmentId?: number }
    );
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.update(
      Number(req.params.id),
      req.body as Partial<{ name: string; email: string; role: 'ADMIN' | 'WORKER'; departmentId: number | null; password: string }>
    );
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
