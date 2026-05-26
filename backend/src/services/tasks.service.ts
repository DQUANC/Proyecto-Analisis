import { PrismaClient, TaskStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
}

export class TaskService {
  async getAll(userId: number) {
    return prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getById(id: number, userId: number) {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      const err: any = new Error('Tarea no encontrada');
      err.status = 404;
      throw err;
    }
    return task;
  }

  async create(data: TaskInput, userId: number) {
    return prisma.task.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        userId,
      },
    });
  }

  async update(id: number, data: Partial<TaskInput>, userId: number) {
    await this.getById(id, userId);
    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.getById(id, userId);
    await prisma.task.delete({ where: { id } });
  }
}
