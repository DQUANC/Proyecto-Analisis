import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, shareReplay, catchError } from 'rxjs/operators';
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

const BRAND_NAVY: [number, number, number] = [11, 29, 61];
const BRAND_TEAL: [number, number, number] = [0, 209, 216];
const LOGO_PATH = 'assets/logos/logotipo-monocromo-navy.png';
const HEADER_HEIGHT = 32;

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly tasksService = inject(TasksService);
  private readonly dashboardService = inject(DashboardService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  private logo$?: Observable<string | null>;

  reportTitle(type: ReportType): string {
    return REPORT_TITLES[type];
  }

  generateTasksByDepartmentPdf(): Observable<void> {
    return this.dashboardService.getByDepartment().pipe(
      switchMap((departments) => {
        const rows = departments.map((d) => [
          d.departmentName,
          String(d.totalTasks),
          this.statusBreakdown(d.tasksByStatus),
        ]);
        return this.buildPdf('TASKS_BY_DEPARTMENT', ['Departamento', 'Total', 'Distribución por estado'], rows);
      })
    );
  }

  generateCompletedTasksPdf(): Observable<void> {
    return this.tasksService.getHistory().pipe(
      switchMap((res) => {
        const rows = res.tasks.map((t) => [
          t.title,
          t.department?.name ?? '—',
          t.assignedTo?.name ?? '—',
          t.completedAt ? t.completedAt.slice(0, 10) : '—',
        ]);
        return this.buildPdf('COMPLETED_TASKS', ['Tarea', 'Departamento', 'Asignado a', 'Fecha de finalización'], rows);
      })
    );
  }

  generateEvaluationsPdf(): Observable<void> {
    return this.tasksService.getHistory().pipe(
      switchMap((res) => {
        const evaluated = res.tasks.filter((t) => t.evaluation != null);
        const rows = evaluated.map((t) => [
          t.title,
          t.assignedTo?.name ?? '—',
          String(t.evaluation?.score ?? '—'),
          t.evaluation?.feedback ?? '—',
        ]);
        return this.buildPdf('EVALUATIONS', ['Tarea', 'Asignado a', 'Puntaje', 'Retroalimentación'], rows);
      })
    );
  }

  private statusBreakdown(tasksByStatus: DepartmentStat['tasksByStatus']): string {
    const entries = Object.entries(tasksByStatus);
    if (!entries.length) return '—';
    return entries.map(([key, value]) => `${STATUS_LABELS[key] ?? key}: ${value}`).join(', ');
  }

  private getLogoBase64(): Observable<string | null> {
    if (!this.logo$) {
      this.logo$ = this.http.get(LOGO_PATH, { responseType: 'blob' }).pipe(
        switchMap((blob) => this.blobToDataUrl(blob)),
        catchError(() => of(null)),
        shareReplay(1)
      );
    }
    return this.logo$;
  }

  private blobToDataUrl(blob: Blob): Observable<string | null> {
    return new Observable((subscriber) => {
      const reader = new FileReader();
      reader.onload = () => {
        subscriber.next(typeof reader.result === 'string' ? reader.result : null);
        subscriber.complete();
      };
      reader.onerror = () => {
        subscriber.next(null);
        subscriber.complete();
      };
      reader.readAsDataURL(blob);
    });
  }

  private buildPdf(type: ReportType, head: string[], rows: string[][]): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) return of(void 0);

    return this.getLogoBase64().pipe(
      map((logo) => {
        const doc = new jsPDF();
        const title = this.reportTitle(type);
        const generatedAt = new Date();

        this.drawHeader(doc, title, generatedAt, logo);

        if (!rows.length) {
          doc.setFontSize(12);
          doc.setTextColor(...BRAND_NAVY);
          doc.text('Sin registros', 14, HEADER_HEIGHT + 14);
          this.drawFooter(doc);
        } else {
          autoTable(doc, {
            startY: HEADER_HEIGHT + 8,
            head: [head],
            body: rows,
            styles: { fontSize: 9 },
            headStyles: { fillColor: BRAND_NAVY },
            didDrawPage: () => this.drawFooter(doc),
          });
        }

        doc.save(this.fileName(generatedAt));
      })
    );
  }

  private drawHeader(doc: jsPDF, title: string, generatedAt: Date, logo: string | null): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(...BRAND_NAVY);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

    const logoSize = 16;
    const logoX = 12;
    const logoY = (HEADER_HEIGHT - logoSize) / 2;
    let textX = logoX;

    if (logo) {
      try {
        doc.addImage(logo, 'PNG', logoX, logoY, logoSize, logoSize);
        textX = logoX + logoSize + 8;
      } catch {
        textX = logoX;
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(title, textX, HEADER_HEIGHT / 2 + 2);

    doc.setFontSize(9);
    doc.setTextColor(...BRAND_TEAL);
    doc.text(
      `Generado el ${generatedAt.toLocaleDateString('es', { year: 'numeric', month: '2-digit', day: '2-digit' })} a las ${generatedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`,
      textX,
      HEADER_HEIGHT / 2 + 9
    );

    doc.setTextColor(...BRAND_NAVY);
  }

  private drawFooter(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = doc.getNumberOfPages();
    const currentPage = doc.getCurrentPageInfo().pageNumber;

    doc.setFontSize(8);
    doc.setTextColor(...BRAND_NAVY);
    doc.text('Nexora', 14, pageHeight - 10);
    doc.text(`Página ${currentPage} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  private fileName(date: Date): string {
    const isoDate = date.toISOString().slice(0, 10);
    return `reporte-tareas-${isoDate}.pdf`;
  }
}
