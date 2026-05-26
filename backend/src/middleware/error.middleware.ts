import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const status: number = err.status ?? 500;
  const message: string = err.message ?? 'Error interno del servidor';
  res.status(status).json({ message });
}
