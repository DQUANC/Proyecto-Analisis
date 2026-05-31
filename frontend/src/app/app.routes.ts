import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/tasks/tasks').then(m => m.TasksComponent),
    canActivate: [authGuard]
  },
  {
    path: 'departments',
    loadComponent: () => import('./pages/departments/departments').then(m => m.DepartmentsComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history').then(m => m.HistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
