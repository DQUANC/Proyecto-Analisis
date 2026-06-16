import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ReportsService, ReportType } from '../../services/reports.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reports',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class ReportsComponent {
  private reportsService = inject(ReportsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  selectedType: ReportType = 'TASKS_BY_DEPARTMENT';
  loading = false;
  error = '';

  readonly reportOptions: { value: ReportType; label: string }[] = [
    { value: 'TASKS_BY_DEPARTMENT', label: 'Tareas por departamento' },
    { value: 'COMPLETED_TASKS', label: 'Tareas completadas' },
    { value: 'EVALUATIONS', label: 'Evaluaciones' },
  ];

  generatePdf() {
    this.error = '';
    this.loading = true;

    const generator$ = this.selectedType === 'TASKS_BY_DEPARTMENT'
      ? this.reportsService.generateTasksByDepartmentPdf()
      : this.selectedType === 'COMPLETED_TASKS'
        ? this.reportsService.generateCompletedTasksPdf()
        : this.reportsService.generateEvaluationsPdf();

    generator$.subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Error al generar el reporte';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
