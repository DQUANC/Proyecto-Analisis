import prisma from '../prisma';
import { hashPassword } from '../utils/password.utils';

function safe<T extends { password: string }>(user: T) {
  const { password: _p, ...rest } = user;
  return rest;
}

export async function getAll(filters: { role?: string }) {
  const users = await prisma.user.findMany({
    where: filters.role ? { role: filters.role as 'ADMIN' | 'WORKER' } : undefined,
    include: { department: true },
    orderBy: { name: 'asc' },
  });
  return users.map(safe);
}

export async function getById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { department: true },
  });
  if (!user) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return safe(user);
}

export async function create(data: {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'WORKER';
  departmentId?: number;
}) {
  const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
  if (emailTaken) {
    const err = new Error('El email ya está registrado') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const deptId = data.departmentId != null ? Number(data.departmentId) : undefined;

  if (deptId) {
    const dept = await prisma.department.findUnique({ where: { id: deptId } });
    if (!dept) {
      const err = new Error('Departamento no encontrado') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role ?? 'WORKER',
      departmentId: deptId ?? null,
    },
    include: { department: true },
  });
  return safe(user);
}

export async function update(
  id: number,
  data: Partial<{ name: string; email: string; role: 'ADMIN' | 'WORKER'; departmentId: number | null; password: string }>
) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      const err = new Error('El email ya está registrado') as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }
  }

  const deptId = data.departmentId != null ? Number(data.departmentId) : data.departmentId;

  if (deptId) {
    const dept = await prisma.department.findUnique({ where: { id: deptId } });
    if (!dept) {
      const err = new Error('Departamento no encontrado') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
  }

  const hashedPassword = data.password ? await hashPassword(data.password) : undefined;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.role !== undefined && { role: data.role }),
      ...(deptId !== undefined && { departmentId: deptId }),
      ...(hashedPassword && { password: hashedPassword }),
    },
    include: { department: true },
  });
  return safe(user);
}

export async function remove(id: number) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  await prisma.user.delete({ where: { id } });
}
