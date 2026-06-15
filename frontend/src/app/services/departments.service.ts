import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_DEPARTMENTS, MOCK_USERS, MOCK_TASKS } from '../mocks/mock-data';

export interface Department {
  id: number;
  name: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/departments`;

  getAll(): Observable<{ departments: Department[] }> {
    if (environment.useMocks) {
      return of({ departments: [...MOCK_DEPARTMENTS] });
    }
    return this.http.get<{ departments: Department[] }>(this.apiUrl);
  }

  create(name: string): Observable<{ department: Department }> {
    if (environment.useMocks) {
      const exists = MOCK_DEPARTMENTS.some(d => d.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        return throwError(() => ({ error: { message: 'El nombre de departamento ya existe' } }));
      }
      const dept: Department = {
        id: Math.max(...MOCK_DEPARTMENTS.map(d => d.id)) + 1,
        name,
        createdAt: new Date().toISOString(),
      };
      MOCK_DEPARTMENTS.push(dept);
      return of({ department: dept });
    }
    return this.http.post<{ department: Department }>(this.apiUrl, { name });
  }

  update(id: number, name: string): Observable<{ department: Department }> {
    if (environment.useMocks) {
      const idx = MOCK_DEPARTMENTS.findIndex(d => d.id === id);
      MOCK_DEPARTMENTS[idx] = { ...MOCK_DEPARTMENTS[idx], name };
      return of({ department: MOCK_DEPARTMENTS[idx] });
    }
    return this.http.put<{ department: Department }>(`${this.apiUrl}/${id}`, { name });
  }

  remove(id: number): Observable<void> {
    if (environment.useMocks) {
      const hasUsers = MOCK_USERS.some(u => u.departmentId === id);
      if (hasUsers) {
        return throwError(() => ({ error: { message: 'No se puede eliminar un departamento que tiene usuarios asignados' } }));
      }
      const hasTasks = MOCK_TASKS.some(t => t.departmentId === id);
      if (hasTasks) {
        return throwError(() => ({ error: { message: 'No se puede eliminar un departamento que tiene tareas asociadas' } }));
      }
      const idx = MOCK_DEPARTMENTS.findIndex(d => d.id === id);
      if (idx !== -1) MOCK_DEPARTMENTS.splice(idx, 1);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
