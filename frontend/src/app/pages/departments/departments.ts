import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { DepartmentsService, Department } from '../../services/departments.service';
import { UsersService, User } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-departments',
  imports: [NavbarComponent, FormsModule, NgIf, NgFor],
  templateUrl: './departments.html',
  styleUrl: './departments.css',
})
export class DepartmentsComponent implements OnInit {
  private service      = inject(DepartmentsService);
  private usersService = inject(UsersService);
  private auth         = inject(AuthService);
  private cdr          = inject(ChangeDetectorRef);

  get isAdmin()    { return this.auth.isAdmin(); }
  get isSuperUser(){ return this.auth.isSuperUser(); }

  departments: Department[] = [];
  usersByDept: Record<number, User[]> = {};
  loading = true;
  error   = '';

  showCreateForm = false;
  newName = '';
  createError = '';

  editingDept: Department | null = null;
  editName = '';

  confirmDeleteId: number | null = null;
  expandedDepts = new Set<number>();

  toggleExpand(id: number) {
    if (this.expandedDepts.has(id)) this.expandedDepts.delete(id);
    else this.expandedDepts.add(id);
  }

  ngOnInit() { setTimeout(() => this.load()); }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => {
        this.departments = res.departments;
        this.usersService.getAll().subscribe({
          next: (uRes) => {
            this.usersByDept = {};
            for (const u of uRes.users) {
              if (u.departmentId != null) {
                if (!this.usersByDept[u.departmentId]) this.usersByDept[u.departmentId] = [];
                this.usersByDept[u.departmentId].push(u);
              }
            }
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      },
      error: (err) => { this.error = err?.error?.message ?? 'Error al cargar departamentos'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getUsersOf(deptId: number): User[] {
    return this.usersByDept[deptId] ?? [];
  }

  create() {
    this.createError = '';
    if (!this.newName.trim()) { this.createError = 'El nombre es requerido'; return; }
    this.service.create(this.newName.trim()).subscribe({
      next: () => { this.newName = ''; this.showCreateForm = false; this.load(); },
      error: (err) => { this.createError = err?.error?.message ?? 'Error al crear'; this.cdr.detectChanges(); }
    });
  }

  openEdit(d: Department) { this.editingDept = d; this.editName = d.name; }

  saveEdit() {
    if (!this.editingDept) return;
    this.service.update(this.editingDept.id, this.editName.trim()).subscribe({
      next: () => { this.editingDept = null; this.load(); },
      error: (err) => { this.error = err?.error?.message ?? 'Error al actualizar'; this.cdr.detectChanges(); }
    });
  }

  remove(id: number) { this.confirmDeleteId = id; }

  confirmDelete() {
    if (this.confirmDeleteId === null) return;
    this.service.remove(this.confirmDeleteId).subscribe({
      next: () => { this.confirmDeleteId = null; this.load(); },
      error: (err) => { this.confirmDeleteId = null; this.error = err?.error?.message ?? 'Error al eliminar'; this.cdr.detectChanges(); }
    });
  }

  cancelDelete() { this.confirmDeleteId = null; }
}