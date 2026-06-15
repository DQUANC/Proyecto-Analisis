import prisma from '../prisma';

export async function getAll() {
  return prisma.department.findMany({ orderBy: { name: 'asc' } });
}

export async function create(name: string) {
  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) {
    const err = new Error('El nombre de departamento ya existe') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }
  return prisma.department.create({ data: { name } });
}

export async function update(id: number, name: string) {
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Departamento no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return prisma.department.update({ where: { id }, data: { name } });
}

export async function remove(id: number) {
  const existing = await prisma.department.findUnique({
    where: { id },
    include: {
      users: { take: 1 },
      tasks: { take: 1 },
    },
  });
  if (!existing) {
    const err = new Error('Departamento no encontrado') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  if (existing.users.length > 0) {
    const err = new Error('No se puede eliminar un departamento que tiene usuarios asignados') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }
  if (existing.tasks.length > 0) {
    const err = new Error('No se puede eliminar un departamento que tiene tareas asociadas') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }
  return prisma.department.delete({ where: { id } });
}
