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
}

export interface LoginResponse {
  token: string;
  user: AppUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  departmentId: number;
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
      const res: LoginResponse = { token: 'mock-token-' + user.id, user };
      this.saveSession(res);
      return of(res);
    }
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(payload: RegisterPayload): Observable<{ message: string }> {
    if (environment.useMocks) {
      return of({ message: 'Registered (mock)' });
    }
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, payload);
  }

  me(): Observable<AppUser> {
    if (environment.useMocks) {
      const user = this.getUser();
      return user ? of(user) : throwError(() => ({ error: { message: 'Not logged in' } }));
    }
    return this.http.get<AppUser>(`${this.apiUrl}/me`);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) return localStorage.getItem('token');
    return null;
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
    return this.getRole() === 'ADMIN';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveSession(res: LoginResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
  }
}
