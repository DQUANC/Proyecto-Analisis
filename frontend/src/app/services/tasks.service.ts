import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_TASKS, MOCK_EVALUATIONS, MOCK_USERS, MOCK_DEPARTMENTS } from '../mocks/mock-data';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskEvaluation {
  id: number;
  taskId: number;
  feedback: string | null;
  score: number | null;
  evaluatedById: number;
}

export interface TaskUser {
  id: number;
  name: string;
  email: string;
}

export interface TaskDepartment {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  createdById: number;
  assignedToId: number | null;
  assignedTo?: TaskUser | null;
  departmentId: number;
  department?: TaskDepartment | null;
  startedAt: string | null;
  completedAt: string | null;
  activeTimeSeconds?: number | null;
  // CAMBIO: campo nuevo proporcionado por el backend con el tiempo activo en días.
  // Se usa en la columna "Tiempo Activo" del historial en vez de activeTimeSeconds.
  activeTimeDays?: number | null;
  createdAt: string;
  updatedAt: string;
  evaluation?: TaskEvaluation | null;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  departmentId: number;
  assignedToId?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  assignedToId?: number;
}

export interface EvaluateTaskPayload {
  feedback?: string;
  score?: number;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  private enrich(t: Task): Task {
    const assignedTo = t.assignedToId
      ? (MOCK_USERS.find(u => u.id === t.assignedToId) ?? null)
      : null;
    const evaluation = MOCK_EVALUATIONS.find(e => e.taskId === t.id) ?? null;
    const department = MOCK_DEPARTMENTS.find(d => d.id === t.departmentId) ?? null;
    let activeTimeSeconds: number | null = null;
    if (t.startedAt) {
      const end = t.completedAt ? new Date(t.completedAt) : new Date();
      activeTimeSeconds = Math.floor((end.getTime() - new Date(t.startedAt).getTime()) / 1000);
    }
    return { ...t, assignedTo, evaluation, department, activeTimeSeconds };
  }

  getAll(): Observable<TasksResponse> {
    if (environment.useMocks) {
      let allTasks = MOCK_TASKS.map(t => this.enrich(t));
      // filter for workers using assignedToId directly (no localStorage dependency)
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        if (user?.role === 'WORKER') {
          allTasks = allTasks.filter(t => t.assignedToId === user.id);
        }
      }
      return of({ tasks: allTasks, total: allTasks.length, page: 1, limit: 20 });
    }
    return this.http.get<TasksResponse>(this.apiUrl);
  }

  getById(id: number): Observable<{ task: Task }> {
    if (environment.useMocks) {
      const task = this.enrich(MOCK_TASKS.find(t => t.id === id)!);
      return of({ task });
    }
    return this.http.get<{ task: Task }>(`${this.apiUrl}/${id}`);
  }

  getHistory(filters: { dateFrom?: string; dateTo?: string } = {}): Observable<{ tasks: Task[] }> {
    if (environment.useMocks) {
      let done = MOCK_TASKS.filter(t => t.status === 'DONE');
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        if (user?.role === 'WORKER') {
          done = done.filter(t => t.assignedToId === user.id);
        }
      }
      const tasks = done
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .map(t => this.enrich(t));
      return of({ tasks });
    }
    const params: Record<string, string> = {};
    if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
    if (filters.dateTo) params['dateTo'] = filters.dateTo;
    return this.http.get<{ tasks: Task[] }>(`${this.apiUrl}/history`, { params });
  }

  create(payload: CreateTaskPayload): Observable<{ task: Task }> {
    if (environment.useMocks) {
      const newTask: Task = {
        id: Math.max(...MOCK_TASKS.map(t => t.id)) + 1,
        title: payload.title,
        description: payload.description ?? null,
        status: 'TO_DO',
        priority: payload.priority ?? 'MEDIUM',
        dueDate: payload.dueDate ?? null,
        departmentId: payload.departmentId,
        assignedToId: payload.assignedToId ?? null,
        createdById: 1,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evaluation: null,
      };
      MOCK_TASKS.push(newTask);
      return of({ task: this.enrich(newTask) });
    }
    return this.http.post<{ task: Task }>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateTaskPayload): Observable<{ task: Task }> {
    if (environment.useMocks) {
      const idx = MOCK_TASKS.findIndex(t => t.id === id);
      const updated = { ...MOCK_TASKS[idx], ...payload, updatedAt: new Date().toISOString() };
      if (payload.status === 'IN_PROGRESS' && !updated.startedAt) updated.startedAt = new Date().toISOString();
      if (payload.status === 'DONE') updated.completedAt = new Date().toISOString();
      MOCK_TASKS[idx] = updated;
      return of({ task: this.enrich(MOCK_TASKS[idx]) });
    }
    return this.http.put<{ task: Task }>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    if (environment.useMocks) {
      const idx = MOCK_TASKS.findIndex(t => t.id === id);
      if (idx !== -1) MOCK_TASKS.splice(idx, 1);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  evaluate(id: number, payload: EvaluateTaskPayload): Observable<{ evaluation: TaskEvaluation }> {
    if (environment.useMocks) {
      const existing = MOCK_EVALUATIONS.findIndex(e => e.taskId === id);
      const evaluation: TaskEvaluation = {
        id: existing >= 0 ? MOCK_EVALUATIONS[existing].id : MOCK_EVALUATIONS.length + 1,
        taskId: id,
        feedback: payload.feedback ?? null,
        score: payload.score ?? null,
        evaluatedById: 1,
      };
      if (existing >= 0) MOCK_EVALUATIONS[existing] = evaluation;
      else MOCK_EVALUATIONS.push(evaluation);
      return of({ evaluation });
    }
    return this.http.post<{ evaluation: TaskEvaluation }>(`${this.apiUrl}/${id}/evaluate`, payload);
  }
}
