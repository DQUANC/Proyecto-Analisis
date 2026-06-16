import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Limpieza: vaciar tablas manteniendo la estructura ───────────────────────
  await prisma.taskEvaluation.deleteMany();
  await prisma.taskStatusHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Tabla auxiliar usada por usersService (usuarios deshabilitados)
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS disabled_users (user_id INTEGER PRIMARY KEY)`;
  await prisma.$executeRaw`TRUNCATE TABLE disabled_users`;

  // ── Departamentos ─────────────────────────────────────────────────────────
  const [ingenieria, diseno, marketing, soporte] = await Promise.all([
    prisma.department.create({ data: { name: 'Ingeniería' } }),
    prisma.department.create({ data: { name: 'Diseño' } }),
    prisma.department.create({ data: { name: 'Marketing' } }),
    prisma.department.create({ data: { name: 'Soporte' } }),
  ]);

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashWorker = await bcrypt.hash('worker123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@test.com',
      password: hashAdmin,
      role: Role.ADMIN,
      departmentId: ingenieria.id,
    },
  });

  // Super usuario: rol de base de datos ADMIN + isSuperUser = true
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrador',
      email: 'superadmin@test.com',
      password: await bcrypt.hash('super123', 10),
      role: Role.ADMIN,
      isSuperUser: true,
      departmentId: ingenieria.id,
    },
  });

  // Ingeniería: desarrollo, QA e infraestructura
  const [ana, diego, sofia] = await Promise.all([
    prisma.user.create({ data: { name: 'Ana López', email: 'ana@test.com', password: hashWorker, role: Role.WORKER, departmentId: ingenieria.id } }),
    prisma.user.create({ data: { name: 'Diego Fernández', email: 'diego@test.com', password: hashWorker, role: Role.WORKER, departmentId: ingenieria.id } }),
    prisma.user.create({ data: { name: 'Sofía Ramírez', email: 'sofia@test.com', password: hashWorker, role: Role.WORKER, departmentId: ingenieria.id } }),
  ]);

  // Diseño: UI/UX
  const [carlos, valentina] = await Promise.all([
    prisma.user.create({ data: { name: 'Carlos Ruiz', email: 'carlos@test.com', password: hashWorker, role: Role.WORKER, departmentId: diseno.id } }),
    prisma.user.create({ data: { name: 'Valentina Castro', email: 'valentina@test.com', password: hashWorker, role: Role.WORKER, departmentId: diseno.id } }),
  ]);

  // Marketing: contenido y campañas
  const [luis, camila] = await Promise.all([
    prisma.user.create({ data: { name: 'Luis Méndez', email: 'luis@test.com', password: hashWorker, role: Role.WORKER, departmentId: marketing.id } }),
    prisma.user.create({ data: { name: 'Camila Rojas', email: 'camila@test.com', password: hashWorker, role: Role.WORKER, departmentId: marketing.id } }),
  ]);

  // Soporte: atención y documentación al usuario
  const [maria, jorge] = await Promise.all([
    prisma.user.create({ data: { name: 'María Torres', email: 'maria@test.com', password: hashWorker, role: Role.WORKER, departmentId: soporte.id } }),
    prisma.user.create({ data: { name: 'Jorge Silva', email: 'jorge@test.com', password: hashWorker, role: Role.WORKER, departmentId: soporte.id } }),
  ]);

  // ── Tareas ────────────────────────────────────────────────────────────────
  const now = new Date();
  const diasDesdeAhora = (d: number) => new Date(now.getTime() + d * 86_400_000);

  // -- Ingeniería --
  const tareaCicd = await prisma.task.create({
    data: {
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

  const tareaToken = await prisma.task.create({
    data: {
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

  const tareaConsultas = await prisma.task.create({
    data: {
      title: 'Optimizar consultas del tablero de control',
      description: 'El endpoint del tablero por departamento es lento. Agregar índices y reescribir las consultas de agregación.',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: diasDesdeAhora(-3),
      departmentId: ingenieria.id,
      createdById: admin.id,
      assignedToId: diego.id,
      startedAt: diasDesdeAhora(-8),
      completedAt: diasDesdeAhora(-4),
    },
  });

  const tareaMigracion = await prisma.task.create({
    data: {
      title: 'Migrar base de datos a nueva versión de PostgreSQL',
      description: 'Planificar ventana de mantenimiento y validar compatibilidad de extensiones antes de actualizar.',
      status: TaskStatus.TO_DO,
      priority: Priority.MEDIUM,
      dueDate: diasDesdeAhora(14),
      departmentId: ingenieria.id,
      createdById: admin.id,
      assignedToId: sofia.id,
    },
  });

  // -- Diseño --
  const tareaMaquetas = await prisma.task.create({
    data: {
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

  const tareaDesignSystem = await prisma.task.create({
    data: {
      title: 'Crear sistema de diseño (design system) en Figma',
      description: 'Definir componentes, tipografía y paleta de colores reutilizables para todo el producto.',
      status: TaskStatus.TO_DO,
      priority: Priority.MEDIUM,
      dueDate: diasDesdeAhora(12),
      departmentId: diseno.id,
      createdById: admin.id,
      assignedToId: valentina.id,
    },
  });

  const tareaOnboarding = await prisma.task.create({
    data: {
      title: 'Rediseñar flujo de onboarding',
      description: 'Simplificar los pasos de registro inicial para reducir el abandono de nuevos usuarios.',
      status: TaskStatus.TO_DO,
      priority: Priority.LOW,
      dueDate: diasDesdeAhora(9),
      departmentId: diseno.id,
      createdById: admin.id,
      assignedToId: carlos.id,
    },
  });

  // -- Marketing --
  const tareaBoletin = await prisma.task.create({
    data: {
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

  const tareaCampana = await prisma.task.create({
    data: {
      title: 'Planificar campaña de redes sociales para lanzamiento',
      description: 'Definir calendario de publicaciones y presupuesto de pauta para el lanzamiento del producto.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: diasDesdeAhora(5),
      departmentId: marketing.id,
      createdById: admin.id,
      assignedToId: camila.id,
      startedAt: diasDesdeAhora(-3),
    },
  });

  const tareaMetricas = await prisma.task.create({
    data: {
      title: 'Analizar métricas de la última campaña publicitaria',
      description: 'Revisar tasas de conversión y costo por adquisición de la campaña anterior y documentar aprendizajes.',
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      dueDate: diasDesdeAhora(-2),
      departmentId: marketing.id,
      createdById: admin.id,
      assignedToId: luis.id,
      startedAt: diasDesdeAhora(-7),
      completedAt: diasDesdeAhora(-3),
    },
  });

  // -- Soporte --
  const tareaDocs = await prisma.task.create({
    data: {
      title: 'Actualizar documentación de incorporación de usuarios',
      description: 'Revisar y actualizar la documentación de incorporación para nuevos agentes de soporte.',
      status: TaskStatus.TO_DO,
      priority: Priority.MEDIUM,
      dueDate: diasDesdeAhora(7),
      departmentId: soporte.id,
      createdById: admin.id,
      assignedToId: maria.id,
    },
  });

  const tareaTicket = await prisma.task.create({
    data: {
      title: 'Resolver ticket recurrente de error de inicio de sesión',
      description: 'Varios usuarios reportan cierre de sesión inesperado. Reproducir el caso y coordinar con Ingeniería.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: diasDesdeAhora(2),
      departmentId: soporte.id,
      createdById: admin.id,
      assignedToId: jorge.id,
      startedAt: diasDesdeAhora(-1),
    },
  });

  const tareaCapacitacion = await prisma.task.create({
    data: {
      title: 'Capacitar al nuevo agente de soporte',
      description: 'Sesión de inducción sobre el sistema de tickets y el protocolo de escalamiento.',
      status: TaskStatus.DONE,
      priority: Priority.LOW,
      dueDate: diasDesdeAhora(-6),
      departmentId: soporte.id,
      createdById: admin.id,
      assignedToId: maria.id,
      startedAt: diasDesdeAhora(-9),
      completedAt: diasDesdeAhora(-7),
    },
  });

  // ── Historial de estados ──────────────────────────────────────────────────
  await prisma.taskStatusHistory.createMany({
    data: [
      { taskId: tareaCicd.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: ana.id, changedAt: diasDesdeAhora(-10) },
      { taskId: tareaCicd.id, oldStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.DONE, changedById: ana.id, changedAt: diasDesdeAhora(-6) },

      { taskId: tareaToken.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: ana.id, changedAt: diasDesdeAhora(-1) },

      { taskId: tareaConsultas.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: diego.id, changedAt: diasDesdeAhora(-8) },
      { taskId: tareaConsultas.id, oldStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.DONE, changedById: diego.id, changedAt: diasDesdeAhora(-4) },

      { taskId: tareaMaquetas.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: carlos.id, changedAt: diasDesdeAhora(-2) },

      { taskId: tareaCampana.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: camila.id, changedAt: diasDesdeAhora(-3) },

      { taskId: tareaMetricas.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: luis.id, changedAt: diasDesdeAhora(-7) },
      { taskId: tareaMetricas.id, oldStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.DONE, changedById: luis.id, changedAt: diasDesdeAhora(-3) },

      { taskId: tareaTicket.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: jorge.id, changedAt: diasDesdeAhora(-1) },

      { taskId: tareaCapacitacion.id, oldStatus: TaskStatus.TO_DO, newStatus: TaskStatus.IN_PROGRESS, changedById: maria.id, changedAt: diasDesdeAhora(-9) },
      { taskId: tareaCapacitacion.id, oldStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.DONE, changedById: maria.id, changedAt: diasDesdeAhora(-7) },
    ],
  });

  // ── Evaluaciones (tareas finalizadas) ────────────────────────────────────
  await prisma.taskEvaluation.createMany({
    data: [
      {
        taskId: tareaCicd.id,
        feedback: 'Excelente trabajo configurando el pipeline. Las pruebas se ejecutan correctamente en cada PR.',
        score: 9,
        evaluatedById: admin.id,
      },
      {
        taskId: tareaConsultas.id,
        feedback: 'Buena mejora en los tiempos de consulta, pero falta el índice en assignedToId. Se requiere seguimiento.',
        score: 7,
        evaluatedById: admin.id,
      },
      {
        taskId: tareaMetricas.id,
        feedback: 'Análisis claro y con recomendaciones concretas para la próxima campaña.',
        score: 8,
        evaluatedById: admin.id,
      },
      {
        taskId: tareaCapacitacion.id,
        feedback: 'Inducción completa, el nuevo agente quedó listo para tomar tickets por su cuenta.',
        score: 8,
        evaluatedById: admin.id,
      },
    ],
  });

  console.log('Seed completado');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
