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
    if (!req.user?.isSuperUser) {
      res.status(403).json({ message: 'Solo el Super Usuario puede editar usuarios.' });
      return;
    }
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
    if (!req.user?.isSuperUser) {
      res.status(403).json({ message: 'Solo el Super Usuario puede eliminar usuarios.' });
      return;
    }
    const id = Number(req.params.id);
    if (req.user?.id === id) {
      res.status(403).json({ message: 'No puedes eliminar tu propia cuenta.' });
      return;
    }
    await usersService.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function disable(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (req.user?.id === id) {
      res.status(403).json({ message: 'No puedes deshabilitarte a ti mismo.' });
      return;
    }
    const target = await usersService.getById(id);
    if ((target.role === 'ADMIN' || target.isSuperUser) && !req.user?.isSuperUser) {
      res.status(403).json({ message: 'Solo el Super Usuario puede deshabilitar administradores.' });
      return;
    }
    await usersService.disableUser(id);
    res.json({ message: 'Usuario deshabilitado' });
  } catch (err) {
    next(err);
  }
}

export async function enable(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const target = await usersService.getById(id);
    if ((target.role === 'ADMIN' || target.isSuperUser) && !req.user?.isSuperUser) {
      res.status(403).json({ message: 'Solo el Super Usuario puede habilitar administradores.' });
      return;
    }
    await usersService.enableUser(id);
    res.json({ message: 'Usuario habilitado' });
  } catch (err) {
    next(err);
  }
}
