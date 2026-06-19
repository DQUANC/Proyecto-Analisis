import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, KeyValuePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar';
import { ChartModule } from 'primeng/chart';
import { DashboardService, DashboardSummary, DepartmentStat, UserStat } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ReportsService, ReportType, DateRange } from '../../services/reports.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',


  imports: [ NgIf, NgFor, KeyValuePipe, NgClass, ChartModule, NavbarComponent, FormsModule],

  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashService    = inject(DashboardService);
  private auth           = inject(AuthService);
  private reportsService = inject(ReportsService);
  private router         = inject(Router);
  private cdr            = inject(ChangeDetectorRef);

  summary: DashboardSummary | null = null;
  departments: DepartmentStat[]    = [];
  users: UserStat[]                = [];
  loading = true;
  error   = '';

  selectedReportType: ReportType = 'TASKS_BY_DEPARTMENT';
  reportDateFrom = '';
  reportDateTo   = '';
  reportLoading  = false;
  reportError    = '';

  readonly reportOptions: { value: ReportType; label: string }[] = [
    { value: 'TASKS_BY_DEPARTMENT', label: 'Tareas por departamento' },
    { value: 'COMPLETED_TASKS',     label: 'Tareas completadas' },
    { value: 'EVALUATIONS',         label: 'Evaluaciones' },
  ];

  chartData: any = null;
  chartOptions: any = {
    plugins: { legend: { position: 'bottom' } },
    responsive: true,
  };

  ngOnInit() {
    setTimeout(() => this.loadData());
  }

  private loadData() {
    this.dashService.getSummary().subscribe({
      next: (data: DashboardSummary) => {
        this.summary = data;
        this.loading = false;
        this.buildChart(data);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Solo accesible para administradores';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
    this.dashService.getByDepartment().subscribe({
      next: (data: DepartmentStat[]) => { this.departments = data; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.dashService.getByUser().subscribe({
      next: (data: UserStat[]) => { this.users = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  private buildChart(data: DashboardSummary) {
    // Traducciones de los estados para las etiquetas del gráfico de torta
    const statusLabels: Record<string, string> = {
      TO_DO:       'Pendiente',
      IN_PROGRESS: 'En progreso',
      DONE:        'Completado',
    };
    const colors: Record<string, string> = {
      TO_DO:       '#ef4444',
      IN_PROGRESS: '#00D1D8',
      DONE:        '#22c55e',
    };

    const labels   = Object.keys(data.tasksByStatus).map(k => statusLabels[k] ?? k);
    const values   = Object.values(data.tasksByStatus);
    const bgColors = Object.keys(data.tasksByStatus).map(k => colors[k] ?? '#6366f1');

    this.chartData = {
      labels,
      datasets: [{ data: values, backgroundColor: bgColors, hoverOffset: 8 }],
    };
  }

  generatePdf() {
    this.reportError = '';
    this.reportLoading = true;

    const dateRange: DateRange = {
      dateFrom: this.reportDateFrom || undefined,
      dateTo:   this.reportDateTo   || undefined,
    };

    const generator$ = this.selectedReportType === 'TASKS_BY_DEPARTMENT'
      ? this.reportsService.generateTasksByDepartmentPdf(dateRange)
      : this.selectedReportType === 'COMPLETED_TASKS'
        ? this.reportsService.generateCompletedTasksPdf(dateRange)
        : this.reportsService.generateEvaluationsPdf(dateRange);

    generator$.subscribe({
      next: () => { this.reportLoading = false; this.cdr.detectChanges(); },
      error: (err: any) => {
        this.reportError = err?.error?.message ?? 'Error al generar el reporte';
        this.reportLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Convierte las claves del backend (TO_DO, IN_PROGRESS, DONE) a texto en español.
  // Se usa en el HTML con {{ statusLabel(s.key) }}
  statusLabel(key: string): string {
    const map: Record<string, string> = {
      TO_DO:       'Pendiente',
      IN_PROGRESS: 'En progreso',
      DONE:        'Completado',
    };
    return map[key] ?? key;
  }

  // Convierte las prioridades del backend (LOW, MEDIUM, HIGH) a texto en español.
  priorityLabel(key: string): string {
    const map: Record<string, string> = {
      LOW:    'Baja',
      MEDIUM: 'Media',
      HIGH:   'Alta',
    };
    return map[key] ?? key;
  }
}
