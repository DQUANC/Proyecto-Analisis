import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { DepartmentsService, Department } from '../../services/departments.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-departments',
  imports: [FormsModule, RouterLink, NgIf, NgFor, SlicePipe],
  templateUrl: './departments.html',
  styleUrl: './departments.css',
})
export class DepartmentsComponent implements OnInit {
  private service = inject(DepartmentsService);
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private cdr     = inject(ChangeDetectorRef);

  departments: Department[] = [];
  loading = true;
  error   = '';

  // CAMBIO: control de rol — solo ADMIN y SUPER_USER ven el botón de crear
  readonly isAdmin = this.auth.isAdmin();

  // Estado del formulario de creación
  showCreateForm = false;
  newName = '';
  nameError = ''; // mensaje de validación del campo nombre

  // Estado de edición inline
  editId: number | null = null;
  editName = '';

  ngOnInit() { setTimeout(() => this.load()); }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => {
        this.departments = res.departments;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al cargar departamentos';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // CAMBIO: validación del campo nombre antes de crear.
  // Si está vacío muestra mensaje, si no llama al servicio POST /api/departments.
  // Si el backend responde con error (ej: nombre duplicado), muestra el mensaje.
  create() {
    this.nameError = '';
    this.error = '';

    if (!this.newName.trim()) {
      this.nameError = 'El nombre del departamento es obligatorio.';
      return;
    }

    this.service.create(this.newName.trim()).subscribe({
      next: () => {
        this.newName = '';
        this.nameError = '';
        this.showCreateForm = false;
        this.load(); // recarga la lista sin recargar la página
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al crear departamento';
        this.cdr.detectChanges();
      }
    });
  }

  startEdit(d: Department) {
    this.editId = d.id;
    this.editName = d.name;
  }

  saveEdit() {
    if (this.editId === null) return;
    this.service.update(this.editId, this.editName).subscribe({
      next: () => { this.editId = null; this.load(); },
      error: (err) => { this.error = err?.error?.message ?? 'Error al actualizar'; }
    });
  }

  remove(id: number) {
    if (!confirm('¿Eliminar este departamento?')) return;
    this.service.remove(id).subscribe({ next: () => this.load() });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
