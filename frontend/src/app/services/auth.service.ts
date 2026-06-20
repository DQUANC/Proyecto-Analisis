import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_USERS } from '../mocks/mock-data';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'WORKER';
  departmentId: number | null;
  isSuperUser?: boolean;
}

export interface LoginResponse {
  user: AppUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(email: string, password: string): Observable<LoginResponse> {
    if (environment.useMocks) {
      const found = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (!found) return throwError(() => ({ error: { message: 'Credenciales inválidas' } }));
      const { password: _p, ...user } = found;
      const res: LoginResponse = { user };
      this.saveSession(res);
      return of(res);
    }
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  me(): Observable<AppUser> {
    if (environment.useMocks) {
      const user = this.getUser();
      return user ? of(user) : throwError(() => ({ error: { message: 'Not logged in' } }));
    }
    return this.http.get<AppUser>(`${this.apiUrl}/me`);
  }

  logout(): void {
    if (environment.useMocks) {
      this.clearSession();
      return;
    }
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  getUser(): AppUser | null {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) as AppUser : null;
    }
    return null;
  }

  getRole(): 'ADMIN' | 'WORKER' | null {
    return this.getUser()?.role ?? null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN' || this.isSuperUser();
  }

  isSuperUser(): boolean {
    return this.getUser()?.isSuperUser === true;
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  private saveSession(res: LoginResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(res.user));
    }
  }

  private clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
    }
  }
}
