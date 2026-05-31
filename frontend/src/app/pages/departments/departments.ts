import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { DepartmentsService, Department } from '../../services/departments.service';

@Component({
  selector: 'app-departments',
  imports: [FormsModule, RouterLink, NgIf, NgFor],
  templateUrl: './departments.html',
  styleUrl: './departments.css',
})
export class DepartmentsComponent implements OnInit {
  private service = inject(DepartmentsService);

  departments: Department[] = [];
  loading = true;
  error = '';
  newName = '';
  editId: number | null = null;
  editName = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.departments = res.departments; this.loading = false; },
      error: (err) => { this.error = err?.error?.message ?? 'Failed to load'; this.loading = false; }
    });
  }

  create() {
    if (!this.newName.trim()) return;
    this.service.create(this.newName.trim()).subscribe({
      next: () => { this.newName = ''; this.load(); },
      error: (err) => { this.error = err?.error?.message ?? 'Failed to create'; }
    });
  }

  startEdit(d: Department) { this.editId = d.id; this.editName = d.name; }

  saveEdit() {
    if (this.editId === null) return;
    this.service.update(this.editId, this.editName).subscribe({
      next: () => { this.editId = null; this.load(); },
      error: (err) => { this.error = err?.error?.message ?? 'Failed to update'; }
    });
  }

  remove(id: number) {
    if (!confirm('Delete this department?')) return;
    this.service.remove(id).subscribe({ next: () => this.load() });
  }
}
