import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { UsersService, User, CreateUserPayload, UpdateUserPayload } from '../../services/users.service';
import { DepartmentsService, Department } from '../../services/departments.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-users',
  imports: [FormsModule, NgIf, NgFor, NavbarComponent],
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
  currentUserId: number | null = null;
  currentUserIsSuperUser = false;

  showCreateForm = false;
  createForm: CreateUserPayload = {
    name: '',
    email: '',
    password: '',
    role: 'WORKER',
    departmentId: undefined,
  };
  createErrors: Record<string, string> = {};

  editingUser: User | null    = null;
  editForm: UpdateUserPayload = {};
  editErrors: Record<string, string> = {};

  confirmDeleteId: number | null = null;

  ngOnInit() {
    this.currentUserId = this.auth.getUser()?.id ?? null;
    this.currentUserIsSuperUser = this.auth.isSuperUser();
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
    this.error = '';
    this.createErrors = {};
    if (!this.createForm.name?.trim())         this.createErrors['name']         = 'El nombre es requerido';
    if (!this.createForm.email?.trim())        this.createErrors['email']        = 'El correo es requerido';
    if (!this.createForm.password?.trim())     this.createErrors['password']     = 'La contraseña es requerida';
    if (!this.createForm.departmentId)         this.createErrors['departmentId'] = 'El departamento es requerido';
    if (Object.keys(this.createErrors).length) return;

    const payload = {
      ...this.createForm,
      name:  this.createForm.name.trim(),
      email: this.createForm.email.trim(),
    };
    this.usersService.create(payload).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.createErrors = {};
        this.createForm = { name: '', email: '', password: '', role: 'WORKER', departmentId: undefined };
        this.load();
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Error al crear usuario';
        this.cdr.detectChanges();
      }
    });
  }

  openEdit(user: User) {
    this.editingUser = user;
    this.editForm = {
      name:         user.name,
      email:        user.email,
      role:         user.isSuperUser ? 'SUPER_USER' : user.role,
      departmentId: user.departmentId ?? undefined,
      password:     '',
    };
  }

  saveEdit() {
    if (!this.editingUser) return;
    this.editErrors = {};
    if (!this.editForm.name?.trim())  this.editErrors['name']  = 'El nombre es requerido';
    if (!this.editForm.email?.trim()) this.editErrors['email'] = 'El correo es requerido';
    if (Object.keys(this.editErrors).length) return;

    const payload = {
      ...this.editForm,
      name:  this.editForm.name!.trim(),
      email: this.editForm.email!.trim(),
    };
    if (!payload.password) delete payload.password;
    this.usersService.update(this.editingUser.id, payload).subscribe({
      next: () => { this.editingUser = null; this.editErrors = {}; this.load(); },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Error al actualizar usuario';
        this.cdr.detectChanges();
      }
    });
  }

  remove(id: number) {
    this.confirmDeleteId = id;
  }

  confirmDelete() {
    if (this.confirmDeleteId === null) return;
    this.usersService.remove(this.confirmDeleteId).subscribe({
      next: () => { this.confirmDeleteId = null; this.load(); },
      error: (err: any) => {
        this.confirmDeleteId = null;
        this.error = err?.error?.message ?? 'Error al eliminar usuario';
        this.cdr.detectChanges();
      }
    });
  }

  cancelDelete() {
    this.confirmDeleteId = null;
  }

  toggleActive(user: User) {
    const action = user.isActive ? this.usersService.disable(user.id) : this.usersService.enable(user.id);
    action.subscribe({
      next: () => this.load(),
      error: (err: any) => { this.error = err?.error?.message ?? 'Error al cambiar estado'; this.cdr.detectChanges(); }
    });
  }

  roleLabel(role: string, isSuperUser?: boolean): string {
    if (isSuperUser) return 'Super Usuario';
    return role === 'ADMIN' ? 'Administrador' : 'Trabajador';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
