import { AppUser } from '../services/auth.service';
import { Task, TaskEvaluation } from '../services/tasks.service';
import { Department } from '../services/departments.service';
import { DashboardSummary, DepartmentStat, UserStat } from '../services/dashboard.service';

// ── Usuarios de prueba ───────────────────────────────────────────────────────
// CAMBIO: nombres traducidos al español (Admin → Administrador, Worker → Trabajador)
export const MOCK_USERS: (AppUser & { password: string })[] = [
  { id: 1, name: 'Administrador',       email: 'admin@test.com',   password: 'admin123',  role: 'ADMIN',  departmentId: 1 },
  { id: 2, name: 'Trabajadora Ana',     email: 'ana@test.com',     password: 'worker123', role: 'WORKER', departmentId: 1 },
  { id: 3, name: 'Trabajador Carlos',   email: 'carlos@test.com',  password: 'worker123', role: 'WORKER', departmentId: 2 },
  { id: 4, name: 'Trabajador Luis',     email: 'luis@test.com',    password: 'worker123', role: 'WORKER', departmentId: 3 },
];

// ── Departamentos de prueba ──────────────────────────────────────────────────
// CAMBIO: nombres de departamentos traducidos al español
export const MOCK_DEPARTMENTS: Department[] = [
  { id: 1, name: 'Ingeniería',  createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'Diseño',      createdAt: '2025-01-01T00:00:00Z' },
  { id: 3, name: 'Marketing',   createdAt: '2025-01-01T00:00:00Z' },
];

// ── Tareas de prueba ─────────────────────────────────────────────────────────
// CAMBIO: títulos y descripciones traducidos al español.
// Los valores de status (IN_PROGRESS, TO_DO, DONE) y priority (HIGH, MEDIUM, LOW)
// se mantienen en inglés porque el backend y los tipos TypeScript los esperan así.
export let MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: 'Configurar pipeline CI/CD',           // CAMBIO: antes 'Setup CI/CD pipeline'
    description: 'Configurar GitHub Actions',      // CAMBIO: antes 'Configure GitHub Actions'
    status: 'IN_PROGRESS', priority: 'HIGH',
    dueDate: '2025-06-15T00:00:00Z', createdById: 1, assignedToId: 2,
    departmentId: 1, startedAt: '2025-05-28T00:00:00Z', completedAt: null,
    createdAt: '2025-05-27T00:00:00Z', updatedAt: '2025-05-28T00:00:00Z',
  },
  {
    id: 2,
    title: 'Diseñar página de inicio',            // CAMBIO: antes 'Design landing page'
    description: 'Nuevas maquetas del homepage',  // CAMBIO: antes 'New homepage mockups'
    status: 'TO_DO', priority: 'MEDIUM',
    dueDate: '2025-06-20T00:00:00Z', createdById: 1, assignedToId: 3,
    departmentId: 2, startedAt: null, completedAt: null,
    createdAt: '2025-05-27T00:00:00Z', updatedAt: '2025-05-27T00:00:00Z',
  },
  {
    id: 3,
    title: 'Escribir pruebas unitarias',          // CAMBIO: antes 'Write unit tests'
    description: null,
    status: 'TO_DO', priority: 'LOW',
    dueDate: null, createdById: 1, assignedToId: 2,
    departmentId: 1, startedAt: null, completedAt: null,
    createdAt: '2025-05-27T00:00:00Z', updatedAt: '2025-05-27T00:00:00Z',
  },
  {
    // Tarea extra para probar el flujo TO_DO → IN_PROGRESS → DONE con worker Ana
    id: 6,
    title: 'Revisar documentación técnica',
    description: 'Actualizar la documentación del módulo de autenticación',
    status: 'TO_DO', priority: 'MEDIUM',
    dueDate: '2025-07-01T00:00:00Z', createdById: 1, assignedToId: 2,
    departmentId: 1, startedAt: null, completedAt: null,
    createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 4,
    title: 'Desplegar en staging',                // CAMBIO: antes 'Deploy to staging'
    description: 'Desplegar versión v1.2',        // CAMBIO: antes 'Deploy v1.2 release'
    status: 'DONE', priority: 'HIGH',
    dueDate: '2025-05-25T00:00:00Z', createdById: 1, assignedToId: 2,
    departmentId: 1, startedAt: '2025-05-24T00:00:00Z', completedAt: '2025-05-25T00:00:00Z',
    createdAt: '2025-05-20T00:00:00Z', updatedAt: '2025-05-25T00:00:00Z',
  },
  {
    id: 5,
    title: 'Corregir bug de inicio de sesión',    // CAMBIO: antes 'Fix login bug'
    description: 'Expiración de token no manejada', // CAMBIO: antes 'Token expiry not handled'
    status: 'DONE', priority: 'HIGH',
    dueDate: '2025-05-20T00:00:00Z', createdById: 1, assignedToId: 3,
    departmentId: 2, startedAt: '2025-05-18T00:00:00Z', completedAt: '2025-05-19T00:00:00Z',
    createdAt: '2025-05-17T00:00:00Z', updatedAt: '2025-05-19T00:00:00Z',
  },
];

// ── Evaluaciones de prueba ───────────────────────────────────────────────────
// CAMBIO: textos de retroalimentación traducidos al español
export let MOCK_EVALUATIONS: TaskEvaluation[] = [
  { id: 1, taskId: 4, feedback: 'Excelente trabajo, desplegado a tiempo.', score: 9, evaluatedById: 1 }, // CAMBIO: antes 'Great work, deployed on time.'
  { id: 2, taskId: 5, feedback: 'Corrección rápida y bien ejecutada.',     score: 8, evaluatedById: 1 }, // CAMBIO: antes 'Quick fix, well done.'
];

// ── Resumen del dashboard ────────────────────────────────────────────────────
export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  totalTasks: 4,
  totalUsers: 4,
  totalDepartments: 3,
  tasksByStatus: { TO_DO: 2, IN_PROGRESS: 1, DONE: 1 },
};

// ── Estadísticas por departamento ────────────────────────────────────────────
// CAMBIO: nombres de departamentos traducidos (coinciden con MOCK_DEPARTMENTS)
export const MOCK_DEPARTMENT_STATS: DepartmentStat[] = [
  { departmentId: 1, departmentName: 'Ingeniería', totalTasks: 3, tasksByStatus: { TO_DO: 1, IN_PROGRESS: 1, DONE: 1 } },
  { departmentId: 2, departmentName: 'Diseño',     totalTasks: 1, tasksByStatus: { TO_DO: 1 } },
];

// ── Estadísticas por usuario ─────────────────────────────────────────────────
// CAMBIO: nombres de usuarios y departamentos traducidos (coinciden con MOCK_USERS y MOCK_DEPARTMENTS)
export const MOCK_USER_STATS: UserStat[] = [
  { userId: 2, userName: 'Trabajadora Ana',   totalAssigned: 3, tasksByStatus: { TO_DO: 1, IN_PROGRESS: 1, DONE: 1 }, department: { id: 1, name: 'Ingeniería' } },
  { userId: 3, userName: 'Trabajador Carlos', totalAssigned: 1, tasksByStatus: { TO_DO: 1 },                          department: { id: 2, name: 'Diseño' } },
  { userId: 4, userName: 'Trabajador Luis',   totalAssigned: 0, tasksByStatus: {},                                    department: { id: 3, name: 'Marketing' } },
];
