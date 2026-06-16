import prisma from '../prisma';
import { comparePassword } from '../utils/password.utils';
import { signToken } from '../utils/jwt.utils';
import { isUserDisabled } from './users.service';

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

  if (await isUserDisabled(user.id)) {
    const err = new Error('Tu cuenta está deshabilitada. Contacta al administrador.') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    const err = new Error('Credenciales inválidas') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const { password: _p, ...safeUser } = user;
  const token = signToken({ id: user.id, email: user.email, role: user.role, departmentId: user.departmentId, isSuperUser: user.isSuperUser });
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
