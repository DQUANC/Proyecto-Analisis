import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TasksService } from './tasks.service';
import { DashboardService, DepartmentStat } from './dashboard.service';

export type ReportType = 'TASKS_BY_DEPARTMENT' | 'COMPLETED_TASKS' | 'EVALUATIONS';

const REPORT_TITLES: Record<ReportType, string> = {
  TASKS_BY_DEPARTMENT: 'Tareas por departamento',
  COMPLETED_TASKS: 'Tareas completadas',
  EVALUATIONS: 'Evaluaciones',
};

const STATUS_LABELS: Record<string, string> = {
  TO_DO: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado',
};

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly tasksService = inject(TasksService);
  private readonly dashboardService = inject(DashboardService);
  private readonly platformId = inject(PLATFORM_ID);

  reportTitle(type: ReportType): string {
    return REPORT_TITLES[type];
  }

  generateTasksByDepartmentPdf(): Observable<void> {
    return this.dashboardService.getByDepartment().pipe(
      map((departments) => {
        const rows = departments.map((d) => [
          d.departmentName,
          String(d.totalTasks),
          this.statusBreakdown(d.tasksByStatus),
        ]);
        this.buildPdf('TASKS_BY_DEPARTMENT', ['Departamento', 'Total', 'Distribución por estado'], rows);
      })
    );
  }

  generateCompletedTasksPdf(): Observable<void> {
    return this.tasksService.getHistory().pipe(
      map((res) => {
        const rows = res.tasks.map((t) => [
          t.title,
          t.department?.name ?? '—',
          t.assignedTo?.name ?? '—',
          t.completedAt ? t.completedAt.slice(0, 10) : '—',
        ]);
        this.buildPdf('COMPLETED_TASKS', ['Tarea', 'Departamento', 'Asignado a', 'Fecha de finalización'], rows);
      })
    );
  }

  generateEvaluationsPdf(): Observable<void> {
    return this.tasksService.getHistory().pipe(
      map((res) => {
        const evaluated = res.tasks.filter((t) => t.evaluation != null);
        const rows = evaluated.map((t) => [
          t.title,
          t.assignedTo?.name ?? '—',
          String(t.evaluation?.score ?? '—'),
          t.evaluation?.feedback ?? '—',
        ]);
        this.buildPdf('EVALUATIONS', ['Tarea', 'Asignado a', 'Puntaje', 'Retroalimentación'], rows);
      })
    );
  }

  private statusBreakdown(tasksByStatus: DepartmentStat['tasksByStatus']): string {
    const entries = Object.entries(tasksByStatus);
    if (!entries.length) return '—';
    return entries.map(([key, value]) => `${STATUS_LABELS[key] ?? key}: ${value}`).join(', ');
  }

  private buildPdf(type: ReportType, head: string[], rows: string[][]): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const doc = new jsPDF();
    const title = this.reportTitle(type);
    const generatedAt = new Date();

    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${this.formatDate(generatedAt)}`, 14, 25);

    if (!rows.length) {
      doc.setFontSize(12);
      doc.text('Sin registros', 14, 38);
    } else {
      autoTable(doc, {
        startY: 32,
        head: [head],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [11, 29, 61] },
      });
    }

    doc.save(this.fileName(generatedAt));
  }

  private fileName(date: Date): string {
    const isoDate = date.toISOString().slice(0, 10);
    return `reporte-tareas-${isoDate}.pdf`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
}
