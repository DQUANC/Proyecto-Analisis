import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Departamentos ─────────────────────────────────────────────────────────
  const [ingenieria, diseno, marketing, soporte] = await Promise.all([
    prisma.department.upsert({ where: { name: 'Ingeniería' },  update: {}, create: { name: 'Ingeniería' } }),
    prisma.department.upsert({ where: { name: 'Diseño' },      update: {}, create: { name: 'Diseño' } }),
    prisma.department.upsert({ where: { name: 'Marketing' },   update: {}, create: { name: 'Marketing' } }),
    prisma.department.upsert({ where: { name: 'Soporte' },     update: {}, create: { name: 'Soporte' } }),
  ]);

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const [admin, ana, carlos, luis, worker2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@test.com',
        password: await bcrypt.hash('admin123', 10),
        role: Role.ADMIN,
        departmentId: ingenieria.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'ana@test.com' },
      update: {},
      create: {
        name: 'Ana López',
        email: 'ana@test.com',
        password: await bcrypt.hash('worker123', 10),
        role: Role.WORKER,
        departmentId: ingenieria.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'carlos@test.com' },
      update: {},
      create: {
        name: 'Carlos Ruiz',
        email: 'carlos@test.com',
        password: await bcrypt.hash('worker123', 10),
        role: Role.WORKER,
        departmentId: diseno.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'luis@test.com' },
      update: {},
      create: {
        name: 'Luis Méndez',
        email: 'luis@test.com',
        password: await bcrypt.hash('worker123', 10),
        role: Role.WORKER,
        departmentId: marketing.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'worker2@test.com' },
      update: {},
      create: {
        name: 'María Torres',
        email: 'worker2@test.com',
        password: await bcrypt.hash('worker456', 10),
        role: Role.WORKER,
        departmentId: soporte.id,
      },
    }),
  ]);

  // ── Tareas ────────────────────────────────────────────────────────────────
  const now = new Date();
  const diasDesdeAhora = (d: number) => new Date(now.getTime() + d * 86_400_000);

  const tarea1 = await prisma.task.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Configurar pipeline de CI/CD',
      description: 'Configurar GitHub Actions para pruebas automatizadas y despliegue en Railway.',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: diasDesdeAhora(-5),
      departmentId: ingenieria.id,
      createdById: admin.id,
      assignedToId: ana.id,
      startedAt: diasDesdeAhora(-10),
      completedAt: diasDesdeAhora(-6),
    },
  });

  const tarea2 = await prisma.task.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Diseñar maquetas de pantalla de inicio de sesión',
      description: 'Crear maquetas de alta fidelidad para las pantallas de inicio de sesión y registro en Figma.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      dueDate: diasDesdeAhora(3),
      departmentId: diseno.id,
      createdById: admin.id,
      assignedToId: carlos.id,
      startedAt: diasDesdeAhora(-2),
    },
  });

  const tarea3 = await prisma.task.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: 'Redactar boletín del segundo trimestre',
      description: 'Preparar y enviar el boletín trimestral a la lista de correos.',
      status: TaskStatus.TO_DO,
      priority: Priority.LOW,
      dueDate: diasDesdeAhora(10),
      departmentId: marketing.id,
      createdById: admin.id,
      assignedToId: luis.id,
    },
  });

  const tarea4 = await prisma.task.upsert({
    where: { id: 4 },
    update: {},
    create: {
      title: 'Corregir renovación de token de autenticación',
      description: 'Los tokens JWT no se renuevan correctamente en móvil. Investigar y aplicar parche.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: diasDesdeAhora(1),
      departmentId: ingenieria.id,
      createdById: admin.id,
      assignedToId: ana.id,
      startedAt: diasDesdeAhora(-1),
    },
  });

  const tarea5 = await prisma.task.upsert({
    where: { id: 5 },
    update: {},
    create: {
      title: 'Actualizar documentación de incorporación de usuarios',
      description: 'Revisar y actualizar la documentación de incorporación para nuevos agentes de soporte.',
      status: TaskStatus.TO_DO,
      priority: Priority.MEDIUM,
      dueDate: diasDesdeAhora(7),
      departmentId: soporte.id,
      createdById: admin.id,
      assignedToId: worker2.id,
    },
  });

  const tarea6 = await prisma.task.upsert({
    where: { id: 6 },
    update: {},
    create: {
      title: 'Optimizar consultas del tablero de control',
      description: 'El endpoint del tablero por departamento es lento. Agregar índices y reescribir las consultas de agregación.',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: diasDesdeAhora(-3),
      departmentId: ingenieria.id,
      createdById: admin.id,
      assignedToId: ana.id,
      startedAt: diasDesdeAhora(-8),
      completedAt: diasDesdeAhora(-4),
    },
  });

  // ── Historial de estados ──────────────────────────────────────────────────
  await prisma.taskStatusHistory.createMany({
    skipDuplicates: true,
    data: [
      // tarea1: POR_HACER → EN_PROGRESO → FINALIZADA
      { taskId: tarea1.id, oldStatus: TaskStatus.TO_DO,       newStatus: TaskStatus.IN_PROGRESS, changedById: ana.id,    changedAt: diasDesdeAhora(-10) },
      { taskId: tarea1.id, oldStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.DONE,         changedById: ana.id,    changedAt: diasDesdeAhora(-6) },
      // tarea2: POR_HACER → EN_PROGRESO
      { taskId: tarea2.id, oldStatus: TaskStatus.TO_DO,       newStatus: TaskStatus.IN_PROGRESS, changedById: carlos.id, changedAt: diasDesdeAhora(-2) },
      // tarea4: POR_HACER → EN_PROGRESO
      { taskId: tarea4.id, oldStatus: TaskStatus.TO_DO,       newStatus: TaskStatus.IN_PROGRESS, changedById: ana.id,    changedAt: diasDesdeAhora(-1) },
      // tarea6: POR_HACER → EN_PROGRESO → FINALIZADA
      { taskId: tarea6.id, oldStatus: TaskStatus.TO_DO,       newStatus: TaskStatus.IN_PROGRESS, changedById: ana.id,    changedAt: diasDesdeAhora(-8) },
      { taskId: tarea6.id, oldStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.DONE,         changedById: ana.id,    changedAt: diasDesdeAhora(-4) },
    ],
  });

  // ── Evaluaciones ──────────────────────────────────────────────────────────
  await prisma.taskEvaluation.upsert({
    where: { taskId: tarea1.id },
    update: {},
    create: {
      taskId: tarea1.id,
      feedback: 'Excelente trabajo configurando el pipeline. Las pruebas se ejecutan correctamente en cada PR.',
      score: 9,
      evaluatedById: admin.id,
    },
  });

  await prisma.taskEvaluation.upsert({
    where: { taskId: tarea6.id },
    update: {},
    create: {
      taskId: tarea6.id,
      feedback: 'Buena mejora en los tiempos de consulta, pero falta el índice en assignedToId. Se requiere seguimiento.',
      score: 7,
      evaluatedById: admin.id,
    },
  });

await prisma.user.upsert({
      where: { email: 'worker2@test.com' },
      update: {},
      create: {
        name: 'Worker2',
        email: 'worker2@test.com',
        password: await bcrypt.hash('worker456', 10),
        role: 'WORKER',
        departmentId: ingenieria.id,
      },
    });

    console.log('Seed completado');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
