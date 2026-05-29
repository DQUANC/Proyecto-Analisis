import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardSummary {
  total: number;
  toDo: number;
  inProgress: number;
  done: number;
}

export interface DepartmentStat {
  departmentId: number;
  departmentName: string;
  total: number;
  toDo: number;
  inProgress: number;
  done: number;
}

export interface UserStat {
  userId: number;
  userName: string;
  total: number;
  done: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  getByDepartment(): Observable<DepartmentStat[]> {
    return this.http.get<DepartmentStat[]>(`${this.apiUrl}/by-department`);
  }

  getByUser(): Observable<UserStat[]> {
    return this.http.get<UserStat[]>(`${this.apiUrl}/by-user`);
  }
}
