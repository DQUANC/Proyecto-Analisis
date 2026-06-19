import { Prisma } from '@prisma/client';
import prisma from '../prisma';

export async function getSummary() {
  const [totalTasks, totalUsers, totalDepartments, byStatus] = await Promise.all([
    prisma.task.count(),
    prisma.user.count(),
    prisma.department.count(),
    prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
  ]);

  const tasksByStatus: Record<string, number> = {};
  byStatus.forEach((r) => { tasksByStatus[r.status] = r._count.id; });

  return { totalTasks, totalUsers, totalDepartments, tasksByStatus };
}

export async function getByDepartment(filters: { dateFrom?: string; dateTo?: string } = {}) {
  const taskWhere: Prisma.TaskWhereInput = {};
  if (filters.dateFrom || filters.dateTo) {
    const gte = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const lte = filters.dateTo ? new Date(filters.dateTo) : undefined;
    if (lte) lte.setHours(23, 59, 59, 999);
    taskWhere.createdAt = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
  }

  const departments = await prisma.department.findMany({
    include: { tasks: { where: taskWhere, select: { status: true } } },
    orderBy: { name: 'asc' },
  });

  return departments.map((dept) => {
    const tasksByStatus: Record<string, number> = {};
    dept.tasks.forEach((t) => {
      tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;
    });
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      totalTasks: dept.tasks.length,
      tasksByStatus,
    };
  });
}

export async function getByUser() {
  const users = await prisma.user.findMany({
    include: {
      assignedTasks: { select: { status: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return users.map((u) => {
    const tasksByStatus: Record<string, number> = {};
    u.assignedTasks.forEach((t) => {
      tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;
    });
    return {
      userId: u.id,
      userName: u.name,
      department: u.department,
      totalAssigned: u.assignedTasks.length,
      tasksByStatus,
    };
  });
}
