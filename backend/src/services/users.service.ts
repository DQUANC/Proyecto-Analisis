import prisma from '../prisma';
import { hashPassword } from '../utils/password.utils';
import { User, Department } from '@prisma/client';

type UserWithDept = User & { department: Department | null };
type AuxRow = { user_id: number };

function safe<T extends { password: string }>(user: T) {
  const { password: _p, ...rest } = user;
  return rest;
}

// ── Tablas auxiliares ────────────────────────────────────────────────────────

export async function initDisabledUsersTable() {
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS disabled_users (user_id INTEGER PRIMARY KEY)`;
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS super_users   (user_id INTEGER PRIMARY KEY)`;
  await loadDisabledCache();
  await loadSuperUsersCache();
}

// ── Cache: usuarios deshabilitados ───────────────────────────────────────────

let disabledCache: Set<number> | null = null;

async function loadDisabledCache(): Promise<Set<number>> {
  if (disabledCache !== null) return disabledCache;
  const rows: AuxRow[] = await prisma.$queryRaw`SELECT user_id FROM disabled_users`;
  disabledCache = new Set(rows.map((r: AuxRow) => Number(r.user_id)));
  return disabledCache;
}

export async function disableUser(id: number) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  await prisma.$executeRaw`INSERT INTO disabled_users (user_id) VALUES (${id}) ON CONFLICT DO NOTHING`;
  if (disabledCache !== null) disabledCache.add(id);
}

export async function enableUser(id: number) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Usuario no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  await prisma.$executeRaw`DELETE FROM disabled_users WHERE user_id = ${id}`;
  if (disabledCache !== null) disabledCache.delete(id);
}

export async function isUserDisabled(id: number): Promise<boolean> {
  const cache = await loadDisabledCache();
  return cache.has(id);
}

// ── Cache: super usuarios ────────────────────────────────────────────────────

let superUsersCache: Set<number> | null = null;

async function loadSuperUsersCache(): Promise<Set<number>> {
  if (superUsersCache !== null) return superUsersCache;
  const rows: AuxRow[] = await prisma.$queryRaw`SELECT user_id FROM super_users`;
  superUsersCache = new Set(rows.map((r: AuxRow) => Number(r.user_id)));
  return superUsersCache;
}

async function addSuperUser(id: number) {
  await prisma.$executeRaw`INSERT INTO super_users (user_id) VALUES (${id}) ON CONFLICT DO NOTHING`;
  if (superUsersCache !== null) superUsersCache.add(id);
}

async function removeSuperUser(id: number) {
  await prisma.$executeRaw`DELETE FROM super_users WHERE user_id = ${id}`;
  if (superUsersCache !== null) superUsersCache.delete(id);
}

// ── CRUD usuarios ────────────────────────────────────────────────────────────

export async function getAll(filters: { role?: string }) {
  // Filtro: SUPER_USER y ADMIN comparten rol DB = 'ADMIN'
  const dbRole = filters.role === 'SUPER_USER' ? 'ADMIN'
               : filters.role === 'WORKER'     ? 'WORKER'
               : filters.role === 'ADMIN'      ? 'ADMIN'
               : undefined;

  const users: UserWithDept[] = await prisma.user.findMany({
    where: dbRole ? { role: dbRole as 'ADMIN' | 'WORKER' } : undefined,
    include: { department: true },
    orderBy: { name: 'asc' },
  });

  const disabledIds   = await loadDisabledCache();
  const superIds      = await loadSuperUsersCache();

  return users.map((u: UserWithDept) => ({
    ...safe(u),
    isActive:    !disabledIds.has(u.id),
    isSuperUser: superIds.has(u.id),
  }));
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
  const superIds = await loadSuperUsersCache();
  return { ...safe(user), isSuperUser: superIds.has(id) };
}

export async function create(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
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

  // SUPER_USER → rol DB = ADMIN
  const isSuperUser = data.role === 'SUPER_USER';
  const dbRole: 'ADMIN' | 'WORKER' = (isSuperUser || data.role === 'ADMIN') ? 'ADMIN' : 'WORKER';

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: dbRole,
      departmentId: deptId ?? null,
    },
    include: { department: true },
  });

  if (isSuperUser) await addSuperUser(user.id);

  return { ...safe(user), isSuperUser };
}

export async function update(
  id: number,
  data: Partial<{ name: string; email: string; role: string; departmentId: number | null; password: string }>
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

  // Manejo del rol
  let dbRole: 'ADMIN' | 'WORKER' | undefined;
  let isSuperUser: boolean | undefined;

  if (data.role !== undefined) {
    isSuperUser = data.role === 'SUPER_USER';
    dbRole = (isSuperUser || data.role === 'ADMIN') ? 'ADMIN' : 'WORKER';

    if (isSuperUser) {
      await addSuperUser(id);
    } else {
      await removeSuperUser(id);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined     && { name: data.name }),
      ...(data.email !== undefined    && { email: data.email }),
      ...(dbRole !== undefined        && { role: dbRole }),
      ...(deptId !== undefined        && { departmentId: deptId }),
      ...(hashedPassword              && { password: hashedPassword }),
    },
    include: { department: true },
  });

  const superIds = await loadSuperUsersCache();
  return { ...safe(user), isSuperUser: superIds.has(id) };
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
  await removeSuperUser(id);
  await prisma.user.delete({ where: { id } });
}
