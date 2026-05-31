import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_USERS } from '../mocks/mock-data';

export interface WorkerUser {
  id: number;
  name: string;
  email: string;
  departmentId: number | null;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  getWorkers(): Observable<{ users: WorkerUser[] }> {
    if (environment.useMocks) {
      const workers = MOCK_USERS
        .filter(u => u.role === 'WORKER')
        .map(({ password: _p, role: _r, ...w }) => w);
      return of({ users: workers });
    }
    return this.http.get<{ users: WorkerUser[] }>(`${this.apiUrl}?role=WORKER`);
  }
}
