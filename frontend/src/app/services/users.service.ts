import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_USERS, MOCK_DEPARTMENTS } from '../mocks/mock-data';

export interface WorkerUser {
  id: number;
  name: string;
  email: string;
  departmentId: number | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'WORKER';
  departmentId: number | null;
  department?: { id: number; name: string } | null;
  createdAt?: string;
  isActive?: boolean;
  isSuperUser?: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'WORKER' | 'SUPER_USER';
  departmentId?: number;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'WORKER' | 'SUPER_USER';
  departmentId?: number | null;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  private enrich(u: typeof MOCK_USERS[number]): User {
    const { password: _p, ...rest } = u;
    const deptId = u.departmentId != null ? Number(u.departmentId) : null;
    const department = deptId != null ? (MOCK_DEPARTMENTS.find(d => d.id === deptId) ?? null) : null;
    return { ...rest, department };
  }

  getWorkers(): Observable<{ users: WorkerUser[] }> {
    if (environment.useMocks) {
      const workers = MOCK_USERS
        .filter(u => u.role === 'WORKER')
        .map(({ password: _p, role: _r, ...w }) => w);
      return of({ users: workers });
    }
    return this.http.get<{ users: WorkerUser[] }>(`${this.apiUrl}?role=WORKER`);
  }

  getAll(role?: string): Observable<{ users: User[] }> {
    if (environment.useMocks) {
      const filtered = role
        ? MOCK_USERS.filter(u => u.role === role)
        : MOCK_USERS;
      return of({ users: filtered.map(u => this.enrich(u)) });
    }
    const url = role ? `${this.apiUrl}?role=${role}` : this.apiUrl;
    return this.http.get<{ users: User[] }>(url);
  }

  create(payload: CreateUserPayload): Observable<{ user: User }> {
    if (environment.useMocks) {
      const newUser = {
        id: Math.max(...MOCK_USERS.map(u => u.id)) + 1,
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        departmentId: payload.departmentId != null ? Number(payload.departmentId) : null,
      };
      MOCK_USERS.push(newUser);
      return of({ user: this.enrich(newUser) });
    }
    return this.http.post<{ user: User }>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateUserPayload): Observable<{ user: User }> {
    if (environment.useMocks) {
      const idx = MOCK_USERS.findIndex(u => u.id === id);
      const safePayload = {
        ...payload,
        ...(payload.departmentId !== undefined && {
          departmentId: payload.departmentId != null ? Number(payload.departmentId) : null,
        }),
      };
      MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...safePayload } as typeof MOCK_USERS[number];
      return of({ user: this.enrich(MOCK_USERS[idx]) });
    }
    return this.http.put<{ user: User }>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    if (environment.useMocks) {
      const idx = MOCK_USERS.findIndex(u => u.id === id);
      if (idx !== -1) MOCK_USERS.splice(idx, 1);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  disable(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/disable`, {});
  }

  enable(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/enable`, {});
  }
}
