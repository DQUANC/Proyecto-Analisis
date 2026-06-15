import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    next();
  };
}

export function requireSuperUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isSuperUser) {
    res.status(403).json({ message: 'Acceso denegado: se requiere Super Usuario' });
    return;
  }
  next();
}
