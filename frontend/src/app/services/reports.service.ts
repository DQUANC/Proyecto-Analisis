import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, shareReplay, catchError } from 'rxjs/operators';
import jsPDF, { GState } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart } from 'chart.js/auto';
import { TasksService } from './tasks.service';
import { DashboardService, DepartmentStat } from './dashboard.service';

export type ReportType = 'TASKS_BY_DEPARTMENT' | 'COMPLETED_TASKS' | 'EVALUATIONS';

const REPORT_TITLES: Record<ReportType, string> = {
  TASKS_BY_DEPARTMENT: 'Tareas por departamento',
  COMPLETED_TASKS: 'Tareas completadas',
  EVALUATIONS: 'Evaluaciones',
};

const REPORT_FILE_SLUGS: Record<ReportType, string> = {
  TASKS_BY_DEPARTMENT: 'reporte-tareas-por-departamento',
  COMPLETED_TASKS: 'reporte-tareas-completadas',
  EVALUATIONS: 'reporte-evaluaciones',
};

const STATUS_LABELS: Record<string, string> = {
  TO_DO: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado',
};

const STATUS_COLORS: Record<string, [number, number, number]> = {
  TO_DO: [107, 114, 128],
  IN_PROGRESS: [0, 209, 216],
  DONE: [34, 197, 94],
};

const BRAND_NAVY: [number, number, number] = [11, 29, 61];
const BRAND_TEAL: [number, number, number] = [0, 209, 216];
const LOGO_PATH = 'assets/logos/icono-app.png';
const PATTERN_PATH = 'assets/logos/patron-grafico.png';
const HEADER_HEIGHT = 32;

interface SummaryCard {
  label: string;
  value: string;
  color: [number, number, number];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly tasksService = inject(TasksService);
  private readonly dashboardService = inject(DashboardService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  private logo$?: Observable<string | null>;
  private pattern$?: Observable<string | null>;

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
        const cards = this.departmentSummaryCards(departments);
        const pieData = this.departmentStatusTotals(departments);
        return this.buildPdf(
          'TASKS_BY_DEPARTMENT',
          ['Departamento', 'Total', 'Distribución por estado'],
          rows,
          cards,
          pieData
        );
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
        const cards: SummaryCard[] = [
          { label: 'Total completadas', value: String(res.tasks.length), color: STATUS_COLORS['DONE'] },
        ];
        return this.buildPdf('COMPLETED_TASKS', ['Tarea', 'Departamento', 'Asignado a', 'Fecha de finalización'], rows, cards);
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
        const scores = evaluated
          .map((t) => t.evaluation?.score)
          .filter((s): s is number => typeof s === 'number');
        const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        const cards: SummaryCard[] = [
          { label: 'Total evaluaciones', value: String(evaluated.length), color: BRAND_NAVY },
          { label: 'Promedio de puntaje', value: avgScore != null ? avgScore.toFixed(1) : '—', color: STATUS_COLORS['IN_PROGRESS'] },
        ];
        return this.buildPdf('EVALUATIONS', ['Tarea', 'Asignado a', 'Puntaje', 'Retroalimentación'], rows, cards);
      })
    );
  }

  private statusBreakdown(tasksByStatus: DepartmentStat['tasksByStatus']): string {
    const entries = Object.entries(tasksByStatus);
    if (!entries.length) return '—';
    return entries.map(([key, value]) => `${STATUS_LABELS[key] ?? key}: ${value}`).join(', ');
  }

  private departmentSummaryCards(departments: DepartmentStat[]): SummaryCard[] {
    const totals: Record<string, number> = {};
    let totalTasks = 0;
    for (const dept of departments) {
      totalTasks += dept.totalTasks;
      for (const [status, count] of Object.entries(dept.tasksByStatus)) {
        totals[status] = (totals[status] ?? 0) + count;
      }
    }
    const cards: SummaryCard[] = [{ label: 'Total de tareas', value: String(totalTasks), color: BRAND_NAVY }];
    for (const status of ['TO_DO', 'IN_PROGRESS', 'DONE']) {
      if (totals[status] != null) {
        cards.push({ label: STATUS_LABELS[status], value: String(totals[status]), color: STATUS_COLORS[status] });
      }
    }
    return cards;
  }

  private departmentStatusTotals(departments: DepartmentStat[]): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const dept of departments) {
      for (const [status, count] of Object.entries(dept.tasksByStatus)) {
        totals[status] = (totals[status] ?? 0) + count;
      }
    }
    return totals;
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

  private getPatternBase64(): Observable<string | null> {
    if (!this.pattern$) {
      this.pattern$ = this.http.get(PATTERN_PATH, { responseType: 'blob' }).pipe(
        switchMap((blob) => this.blobToDataUrl(blob)),
        switchMap((dataUrl) => (dataUrl ? this.cropPattern(dataUrl) : of(null))),
        catchError(() => of(null)),
        shareReplay(1)
      );
    }
    return this.pattern$;
  }

  private cropPattern(dataUrl: string): Observable<string | null> {
    return new Observable((subscriber) => {
      const img = new Image();
      img.onload = () => {
        try {
          const sy = Math.round(img.height * 0.15);
          const sh = Math.round(img.height * 0.7);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = sh;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            subscriber.next(null);
            subscriber.complete();
            return;
          }
          ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, img.width, sh);
          subscriber.next(canvas.toDataURL('image/png'));
        } catch {
          subscriber.next(null);
        }
        subscriber.complete();
      };
      img.onerror = () => {
        subscriber.next(null);
        subscriber.complete();
      };
      img.src = dataUrl;
    });
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

  private buildStatusPieChart(statusTotals: Record<string, number>): Observable<string | null> {
    const entries = Object.entries(statusTotals).filter(([, count]) => count > 0);
    if (!entries.length) return of(null);

    return new Observable((subscriber) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        subscriber.next(null);
        subscriber.complete();
        return;
      }

      const chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: entries.map(([key]) => STATUS_LABELS[key] ?? key),
          datasets: [
            {
              data: entries.map(([, count]) => count),
              backgroundColor: entries.map(([key]) => this.rgbToHex(STATUS_COLORS[key] ?? BRAND_NAVY)),
            },
          ],
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 13 } } },
          },
        },
      });

      requestAnimationFrame(() => {
        try {
          subscriber.next(canvas.toDataURL('image/png'));
        } catch {
          subscriber.next(null);
        } finally {
          chart.destroy();
          subscriber.complete();
        }
      });
    });
  }

  private rgbToHex([r, g, b]: [number, number, number]): string {
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }

  private buildPdf(
    type: ReportType,
    head: string[],
    rows: string[][],
    cards: SummaryCard[] = [],
    statusTotals?: Record<string, number>
  ): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) return of(void 0);

    const pieChart$ = statusTotals ? this.buildStatusPieChart(statusTotals) : of(null);

    return forkJoin({
      logo: this.getLogoBase64(),
      pattern: this.getPatternBase64(),
      pieChart: pieChart$,
    }).pipe(
      map(({ logo, pattern, pieChart }) => {
        const doc = new jsPDF();
        const title = this.reportTitle(type);
        const generatedAt = new Date();

        this.drawHeader(doc, title, generatedAt, logo, pattern);

        let cursorY = HEADER_HEIGHT + 10;
        if (cards.length) {
          cursorY = this.drawSummaryCards(doc, cards, cursorY);
        }

        if (pieChart) {
          cursorY = this.drawPieChartSection(doc, pieChart, cursorY);
        }

        if (!rows.length) {
          doc.setFontSize(12);
          doc.setTextColor(...BRAND_NAVY);
          doc.text('Sin registros', 14, cursorY + 8);
          this.drawFooter(doc);
        } else {
          autoTable(doc, {
            startY: cursorY + 4,
            head: [head],
            body: rows,
            styles: { fontSize: 9 },
            headStyles: { fillColor: BRAND_NAVY },
            didDrawPage: () => this.drawFooter(doc),
          });
        }

        doc.save(this.fileName(generatedAt, type));
      })
    );
  }

  private drawHeader(doc: jsPDF, title: string, generatedAt: Date, logo: string | null, pattern: string | null): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(...BRAND_NAVY);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

    if (pattern) {
      try {
        const props = doc.getImageProperties(pattern);
        const patternWidth = 70;
        const patternHeight = (props.height / props.width) * patternWidth;
        doc.setGState(new GState({ opacity: 0.12 }));
        doc.addImage(
          pattern,
          'PNG',
          pageWidth - patternWidth,
          (HEADER_HEIGHT - patternHeight) / 2,
          patternWidth,
          patternHeight
        );
        doc.setGState(new GState({ opacity: 1 }));
      } catch {
        // si falla el patrón decorativo, se omite sin afectar el resto del header
      }
    }

    const logoMaxSize = 16;
    const logoX = 12;
    let logoWidth = logoMaxSize;
    let logoHeight = logoMaxSize;
    let textX = logoX;

    if (logo) {
      try {
        const props = doc.getImageProperties(logo);
        const ratio = props.width / props.height;
        if (ratio >= 1) {
          logoWidth = logoMaxSize;
          logoHeight = logoMaxSize / ratio;
        } else {
          logoHeight = logoMaxSize;
          logoWidth = logoMaxSize * ratio;
        }
        const logoY = (HEADER_HEIGHT - logoHeight) / 2;
        doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
        textX = logoX + logoWidth + 8;
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

  private drawSummaryCards(doc: jsPDF, cards: SummaryCard[], startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const gap = 4;
    const cardWidth = (pageWidth - margin * 2 - gap * (cards.length - 1)) / cards.length;
    const cardHeight = 20;

    cards.forEach((card, index) => {
      const x = margin + index * (cardWidth + gap);
      doc.setDrawColor(220, 224, 230);
      doc.setFillColor(248, 249, 251);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(15);
      doc.setTextColor(...card.color);
      doc.text(card.value, x + cardWidth / 2, startY + 11, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(...BRAND_NAVY);
      doc.text(card.label, x + cardWidth / 2, startY + 17, { align: 'center' });
    });

    return startY + cardHeight + 10;
  }

  private drawPieChartSection(doc: jsPDF, pieChart: string, startY: number): number {
    doc.setFontSize(11);
    doc.setTextColor(...BRAND_NAVY);
    doc.text('Distribución por estado', 14, startY + 4);

    const chartSize = 55;
    doc.addImage(pieChart, 'PNG', 14, startY + 7, chartSize, chartSize);

    return startY + chartSize + 12;
  }

  private drawFooter(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = doc.getNumberOfPages();
    const currentPage = doc.getCurrentPageInfo().pageNumber;

    doc.setFontSize(8);
    doc.setTextColor(...BRAND_NAVY);
    doc.text('Nexora · Reporte generado automáticamente · Confidencial', 14, pageHeight - 10);
    doc.text(`Página ${currentPage} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  private fileName(date: Date, type: ReportType): string {
    const isoDate = date.toISOString().slice(0, 10);
    return `${REPORT_FILE_SLUGS[type]}-${isoDate}.pdf`;
  }
}
