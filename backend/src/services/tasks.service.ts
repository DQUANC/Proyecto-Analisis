import { TaskStatus, Prisma } from '@prisma/client';
import prisma from '../prisma';

const taskInclude = {
  department: true,
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  evaluation: true,
} satisfies Prisma.TaskInclude;

function withActiveTime(task: Prisma.TaskGetPayload<{ include: typeof taskInclude }>) {
  let activeTimeSeconds: number | null = null;
  let activeTimeDays: number | null = null;
  if (task.startedAt) {
    const end = task.completedAt ?? new Date();
    activeTimeSeconds = Math.floor((end.getTime() - task.startedAt.getTime()) / 1000);
    activeTimeDays = Math.round(activeTimeSeconds / 86400);
  }
  return { ...task, activeTimeSeconds, activeTimeDays };
}

export async function getTasks(
  user: { id: number; role: string; departmentId: number | null },
  filters: { status?: TaskStatus; departmentId?: number; assignedToId?: number; page?: number; limit?: number }
) {
  const where: Prisma.TaskWhereInput = {};

  if (user.role === 'WORKER') {
    where.OR = [
      { assignedToId: user.id },
      { departmentId: user.departmentId ?? -1 },
    ];
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (!filters.status) {
    where.AND = [
      {
        OR: [
          { status: { notIn: ['DONE'] } },
          { status: 'DONE', completedAt: { gte: startOfToday } },
        ],
      },
    ];
  } else if (filters.status === 'DONE') {
    where.status = 'DONE';
    where.completedAt = { gte: startOfToday };
  } else {
    where.status = filters.status;
  }

  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.departmentId && user.role === 'ADMIN') where.departmentId = filters.departmentId;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks: tasks.map(t => {
      const r = withActiveTime(t);
      if (user.role === 'WORKER') r.completedAt = null;
      return r;
    }),
    total,
    page,
    limit,
  };
}

export async function getTaskById(
  id: number,
  user: { id: number; role: string; departmentId: number | null }
) {
  const include: Prisma.TaskInclude = {
    ...taskInclude,
    evaluation: user.role === 'ADMIN',
    statusHistory: { include: { changedBy: { select: { id: true, name: true } } }, orderBy: { changedAt: 'desc' } },
  };

  const task = await prisma.task.findUnique({
    where: { id },
    include,
  });

  if (!task) {
    const err = new Error('Tarea no encontrada') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'WORKER' && task.assignedToId !== user.id && task.departmentId !== user.departmentId) {
    const err = new Error('Acceso denegado') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  return withActiveTime(task as Prisma.TaskGetPayload<{ include: typeof taskInclude }>);
}

export async function createTask(
  data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    departmentId: number;
    assignedToId?: number;
  },
  createdById: number
) {
  const deptId = Number(data.departmentId);
  if (!deptId) {
    const err = new Error('Debes seleccionar un área de trabajo.') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: (data.priority as 'LOW' | 'MEDIUM' | 'HIGH') ?? 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      departmentId: deptId,
      assignedToId: data.assignedToId != null ? Number(data.assignedToId) : null,
      createdById,
    },
    include: taskInclude,
  });

  return withActiveTime(task);
}

export async function updateTask(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: string;
    dueDate: string;
    assignedToId: number;
  }>,
  user: { id: number; role: string; departmentId: number | null; isSuperUser: boolean }
) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Tarea no encontrada') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'WORKER' && existing.assignedToId !== user.id && existing.departmentId !== user.departmentId) {
    const err = new Error('Acceso denegado') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  const editsFullFields = data.title !== undefined || data.description !== undefined
    || data.priority !== undefined || data.dueDate !== undefined || data.assignedToId !== undefined;

  if (editsFullFields && !user.isSuperUser) {
    const err = new Error('Solo el Super Usuario puede editar tareas.') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  const updateData: Prisma.TaskUpdateInput = {};

  if (user.isSuperUser) {
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority as 'LOW' | 'MEDIUM' | 'HIGH';
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.assignedToId !== undefined) updateData.assignedTo = { connect: { id: Number(data.assignedToId) } };
  }

  if (data.status !== undefined && data.status !== existing.status) {
    const VALID_TRANSITIONS: Record<string, TaskStatus[]> = {
      TO_DO: ['IN_PROGRESS'],
      IN_PROGRESS: ['DONE', 'TO_DO'],
      DONE: [],
    };
    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(data.status)) {
      const err = new Error(
        `Transición de estado inválida: ${existing.status} → ${data.status}`
      ) as Error & { statusCode: number };
      err.statusCode = 422;
      throw err;
    }

    updateData.status = data.status;

    if (data.status === 'IN_PROGRESS' && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    if (data.status === 'DONE') {
      updateData.completedAt = new Date();
    }

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        oldStatus: existing.status,
        newStatus: data.status,
        changedById: user.id,
      },
    });
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: taskInclude,
  });

  return withActiveTime(task);
}

export async function deleteTask(id: number) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Tarea no encontrada') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  await prisma.task.delete({ where: { id } });
}

export async function getHistory(
  user: { id: number; role: string; departmentId: number | null },
  filters: { departmentId?: number; assignedToId?: number; dateFrom?: string; dateTo?: string; page?: number; limit?: number }
) {
  const where: Prisma.TaskWhereInput = { status: 'DONE' };

  if (user.role === 'WORKER') {
    where.OR = [{ assignedToId: user.id }, { departmentId: user.departmentId ?? -1 }];
  }
  if (filters.departmentId && user.role === 'ADMIN') where.departmentId = filters.departmentId;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.dateFrom || filters.dateTo) {
    where.completedAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { completedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks: tasks.map(t => {
      const r = withActiveTime(t);
      if (user.role === 'WORKER') r.completedAt = null;
      return r;
    }),
    total,
    page,
    limit,
  };
}

export async function getTaskStatusHistory(
  id: number,
  user: { id: number; role: string; departmentId: number | null }
) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    const err = new Error('Tarea no encontrada') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'WORKER' && task.assignedToId !== user.id && task.departmentId !== user.departmentId) {
    const err = new Error('Acceso denegado') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  return prisma.taskStatusHistory.findMany({
    where: { taskId: id },
    include: { changedBy: { select: { id: true, name: true } } },
    orderBy: { changedAt: 'asc' },
  });
}

export async function evaluateTask(
  taskId: number,
  data: { feedback?: string; score?: number },
  evaluatedById: number
) {
  if (data.score !== undefined && data.score !== null) {
    if (!Number.isInteger(data.score) || data.score < 1 || data.score > 10) {
      const err = new Error('El puntaje debe ser un numero entero entre 1 y 10') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const err = new Error('Tarea no encontrada') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (task.status !== 'DONE') {
    const err = new Error('Solo se pueden evaluar tareas en estado DONE') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  return prisma.taskEvaluation.upsert({
    where: { taskId },
    create: { taskId, feedback: data.feedback, score: data.score, evaluatedById },
    update: { feedback: data.feedback, score: data.score, evaluatedById },
  });
}
