import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { UsersService, User, CreateUserPayload, UpdateUserPayload } from '../../services/users.service';
import { DepartmentsService, Department } from '../../services/departments.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  imports: [FormsModule, RouterLink, NgIf, NgFor],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {
  private usersService   = inject(UsersService);
  private deptService    = inject(DepartmentsService);
  private auth           = inject(AuthService);
  private router         = inject(Router);
  private cdr            = inject(ChangeDetectorRef);

  users:       User[]       = [];
  departments: Department[] = [];
  loading = true;
  error   = '';

  showCreateForm = false;
  createForm: CreateUserPayload = {
    name: '',
    email: '',
    password: '',
    role: 'WORKER',
    departmentId: undefined,
  };

  editingUser: User | null    = null;
  editForm: UpdateUserPayload = {};

  ngOnInit() {
    setTimeout(() => {
      this.load();
      this.deptService.getAll().subscribe({
        next: (res) => this.departments = res.departments,
        error: () => {}
      });
    });
  }

  load() {
    this.loading = true;
    this.usersService.getAll().subscribe({
      next: (res) => {
        this.users   = res.users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error   = err?.error?.message ?? 'Error al cargar usuarios';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  create() {
    this.usersService.create(this.createForm).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.createForm = { name: '', email: '', password: '', role: 'WORKER', departmentId: undefined };
        this.load();
      },
      error: (err: any) => { this.error = err?.error?.message ?? 'Error al crear usuario'; }
    });
  }

  openEdit(user: User) {
    this.editingUser = user;
    this.editForm = {
      name:         user.name,
      email:        user.email,
      role:         user.role,
      departmentId: user.departmentId ?? undefined,
      password:     '',
    };
  }

  saveEdit() {
    if (!this.editingUser) return;
    const payload = { ...this.editForm };
    if (!payload.password) delete payload.password;
    this.usersService.update(this.editingUser.id, payload).subscribe({
      next: () => { this.editingUser = null; this.load(); },
      error: (err: any) => { this.error = err?.error?.message ?? 'Error al actualizar usuario'; }
    });
  }

  remove(id: number) {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.usersService.remove(id).subscribe({ next: () => this.load() });
  }

  roleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrador' : 'Trabajador';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
