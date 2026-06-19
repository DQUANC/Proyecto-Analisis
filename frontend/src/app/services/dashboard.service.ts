import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_DASHBOARD_SUMMARY, MOCK_DEPARTMENT_STATS, MOCK_USER_STATS } from '../mocks/mock-data';

export interface DashboardSummary {
  totalTasks: number;
  totalUsers: number;
  totalDepartments: number;
  tasksByStatus: Record<string, number>;
}

export interface DepartmentStat {
  departmentId: number;
  departmentName: string;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
}

export interface UserStat {
  userId: number;
  userName: string;
  totalAssigned: number;
  tasksByStatus: Record<string, number>;
  department: { id: number; name: string } | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<DashboardSummary> {
    if (environment.useMocks) return of({ ...MOCK_DASHBOARD_SUMMARY });
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  getByDepartment(filters: { dateFrom?: string; dateTo?: string } = {}): Observable<DepartmentStat[]> {
    if (environment.useMocks) return of([...MOCK_DEPARTMENT_STATS]);
    const params: Record<string, string> = {};
    if (filters.dateFrom) params['dateFrom'] = filters.dateFrom;
    if (filters.dateTo) params['dateTo'] = filters.dateTo;
    return this.http.get<DepartmentStat[]>(`${this.apiUrl}/by-department`, { params });
  }

  getByUser(): Observable<UserStat[]> {
    if (environment.useMocks) return of([...MOCK_USER_STATS]);
    return this.http.get<UserStat[]>(`${this.apiUrl}/by-user`);
  }
}
