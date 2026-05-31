import { AppUser } from '../services/auth.service';
import { Task, TaskEvaluation } from '../services/tasks.service';
import { Department } from '../services/departments.service';
import { DashboardSummary, DepartmentStat, UserStat } from '../services/dashboard.service';

export const MOCK_USERS: (AppUser & { password: string })[] = [
  { id: 1, name: 'Admin User',    email: 'admin@test.com',   password: 'admin123',  role: 'ADMIN',  departmentId: 1 },
  { id: 2, name: 'Worker Ana',    email: 'ana@test.com',     password: 'worker123', role: 'WORKER', departmentId: 1 },
  { id: 3, name: 'Worker Carlos', email: 'carlos@test.com',  password: 'worker123', role: 'WORKER', departmentId: 2 },
  { id: 4, name: 'Worker Luis',   email: 'luis@test.com',    password: 'worker123', role: 'WORKER', departmentId: 3 },
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 1, name: 'Engineering', createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'Design',      createdAt: '2025-01-01T00:00:00Z' },
  { id: 3, name: 'Marketing',   createdAt: '2025-01-01T00:00:00Z' },
];

export let MOCK_TASKS: Task[] = [
  {
    id: 1, title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions',
    status: 'IN_PROGRESS', priority: 'HIGH',
    dueDate: '2025-06-15T00:00:00Z', createdById: 1, assignedToId: 2,
    departmentId: 1, startedAt: '2025-05-28T00:00:00Z', completedAt: null,
    createdAt: '2025-05-27T00:00:00Z', updatedAt: '2025-05-28T00:00:00Z',
  },
  {
    id: 2, title: 'Design landing page', description: 'New homepage mockups',
    status: 'TO_DO', priority: 'MEDIUM',
    dueDate: '2025-06-20T00:00:00Z', createdById: 1, assignedToId: 3,
    departmentId: 2, startedAt: null, completedAt: null,
    createdAt: '2025-05-27T00:00:00Z', updatedAt: '2025-05-27T00:00:00Z',
  },
  {
    id: 3, title: 'Write unit tests', description: null,
    status: 'TO_DO', priority: 'LOW',
    dueDate: null, createdById: 1, assignedToId: 2,
    departmentId: 1, startedAt: null, completedAt: null,
    createdAt: '2025-05-27T00:00:00Z', updatedAt: '2025-05-27T00:00:00Z',
  },
  {
    id: 4, title: 'Deploy to staging', description: 'Deploy v1.2 release',
    status: 'DONE', priority: 'HIGH',
    dueDate: '2025-05-25T00:00:00Z', createdById: 1, assignedToId: 2,
    departmentId: 1, startedAt: '2025-05-24T00:00:00Z', completedAt: '2025-05-25T00:00:00Z',
    createdAt: '2025-05-20T00:00:00Z', updatedAt: '2025-05-25T00:00:00Z',
  },
  {
    id: 5, title: 'Fix login bug', description: 'Token expiry not handled',
    status: 'DONE', priority: 'HIGH',
    dueDate: '2025-05-20T00:00:00Z', createdById: 1, assignedToId: 3,
    departmentId: 2, startedAt: '2025-05-18T00:00:00Z', completedAt: '2025-05-19T00:00:00Z',
    createdAt: '2025-05-17T00:00:00Z', updatedAt: '2025-05-19T00:00:00Z',
  },
];

export let MOCK_EVALUATIONS: TaskEvaluation[] = [
  { id: 1, taskId: 4, feedback: 'Great work, deployed on time.', score: 9, evaluatedById: 1 },
  { id: 2, taskId: 5, feedback: 'Quick fix, well done.', score: 8, evaluatedById: 1 },
];

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  totalTasks: 4,
  totalUsers: 4,
  totalDepartments: 3,
  tasksByStatus: { TO_DO: 2, IN_PROGRESS: 1, DONE: 1 },
};

export const MOCK_DEPARTMENT_STATS: DepartmentStat[] = [
  { departmentId: 1, departmentName: 'Engineering', totalTasks: 3, tasksByStatus: { TO_DO: 1, IN_PROGRESS: 1, DONE: 1 } },
  { departmentId: 2, departmentName: 'Design',      totalTasks: 1, tasksByStatus: { TO_DO: 1 } },
];

export const MOCK_USER_STATS: UserStat[] = [
  { userId: 2, userName: 'Worker Ana',    totalAssigned: 3, tasksByStatus: { TO_DO: 1, IN_PROGRESS: 1, DONE: 1 }, department: { id: 1, name: 'Engineering' } },
  { userId: 3, userName: 'Worker Carlos', totalAssigned: 1, tasksByStatus: { TO_DO: 1 },                          department: { id: 2, name: 'Design' } },
  { userId: 4, userName: 'Worker Luis',   totalAssigned: 0, tasksByStatus: {},                                    department: { id: 3, name: 'Marketing' } },
];
