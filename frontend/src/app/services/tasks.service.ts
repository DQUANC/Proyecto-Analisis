import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TaskStatus = 'to_do' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  createdBy: number;
  assignedTo: number;
  departmentId: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  dueDate: string;
  assignedTo: number;
  departmentId: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  assignedTo?: number;
}

export interface EvaluateTaskPayload {
  feedback: string;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  getHistory(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/history`);
  }

  create(payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateTaskPayload): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  evaluate(id: number, payload: EvaluateTaskPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/evaluate`, payload);
  }
}
