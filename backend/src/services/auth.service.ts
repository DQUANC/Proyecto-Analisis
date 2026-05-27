import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { signToken } from '../utils/jwt.utils';

const prisma = new PrismaClient();

export async function register(data: {
  name: string;
  email: string;
  password: string;
  departmentId?: number;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error('El email ya está registrado') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      departmentId: data.departmentId ?? null,
    },
    include: { department: true },
  });

  const { password: _p, ...safeUser } = user;
  const token = signToken({ id: user.id, email: user.email, role: user.role, departmentId: user.departmentId });
  return { token, user: safeUser };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { department: true },
  });

  if (!user) {
    const err = new Error('Credenciales inválidas') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    const err = new Error('Credenciales inválidas') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const { password: _p, ...safeUser } = user;
  const token = signToken({ id: user.id, email: user.email, role: user.role, departmentId: user.departmentId });
  return { token, user: safeUser };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { department: true },
  });

  if (!user) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const { password: _p, ...safeUser } = user;
  return safeUser;
}
