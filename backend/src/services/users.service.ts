import prisma from '../prisma';
import { hashPassword } from '../utils/password.utils';
import { User, Department } from '@prisma/client';

type UserWithDept = User & { department: Department | null };

function safe<T extends { password: string }>(user: T) {
  const { password: _p, ...rest } = user;
  return rest;
}

export async function initDisabledUsersTable() {
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS disabled_users (user_id INTEGER PRIMARY KEY)`;
}

type DisabledRow = { user_id: number };

async function getDisabledIds(): Promise<Set<number>> {
  const rows: DisabledRow[] = await prisma.$queryRaw`SELECT user_id FROM disabled_users`;
  return new Set(rows.map((r: DisabledRow) => Number(r.user_id)));
}

export async function getAll(filters: { role?: string }) {
  const users: UserWithDept[] = await prisma.user.findMany({
    where: filters.role ? { role: filters.role as 'ADMIN' | 'WORKER' } : undefined,
    include: { department: true },
    orderBy: { name: 'asc' },
  });
  const disabledIds = await getDisabledIds();
  return users.map((u: UserWithDept) => ({ ...safe(u), isActive: !disabledIds.has(u.id) }));
}

export async function disableUser(id: number) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  await prisma.$executeRaw`INSERT INTO disabled_users (user_id) VALUES (${id}) ON CONFLICT DO NOTHING`;
}

export async function enableUser(id: number) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  await prisma.$executeRaw`DELETE FROM disabled_users WHERE user_id = ${id}`;
}

export async function isUserDisabled(id: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ user_id: number }[]>`SELECT user_id FROM disabled_users WHERE user_id = ${id}`;
  return rows.length > 0;
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
  const existing = await prisma.user.findUnique({
    where: { id },
    include: {
      createdTasks:  { take: 1 },
      assignedTasks: { take: 1 },
      statusChanges: { take: 1 },
      evaluations:   { take: 1 },
    },
  });
  if (!existing) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  const hasTasks =
    existing.createdTasks.length > 0 ||
    existing.assignedTasks.length > 0 ||
    existing.statusChanges.length > 0 ||
    existing.evaluations.length > 0;
  if (hasTasks) {
    const err = new Error('No se puede eliminar un usuario que tiene tareas asociadas. Deshabilitalo en su lugar.') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }
  await prisma.user.delete({ where: { id } });
}
