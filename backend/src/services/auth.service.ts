import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET: string = (() => {
  const v = process.env.JWT_SECRET;
  if (!v) throw new Error('JWT_SECRET environment variable is required');
  return v;
})();

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err: any = new Error('El email ya está registrado');
      err.status = 409;
      throw err;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name } });
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err: any = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err: any = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }
}
