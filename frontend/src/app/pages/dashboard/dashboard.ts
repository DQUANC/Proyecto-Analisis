import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

// SOLUCIÓN ERROR 1: se agregó NgClass a la importación de '@angular/common'.
// El error era: "Can't bind to 'ngClass' since it isn't a known property of 'span'"
// Causa: el dashboard.html usaba [ngClass] pero NgClass no estaba declarado aquí.
// En Angular standalone cada directiva debe importarse explícitamente en el componente
// que la usa. Sin este import, Angular no reconoce [ngClass] y falla la compilación.
import { NgIf, NgFor, KeyValuePipe, NgClass } from '@angular/common';

import { ChartModule } from 'primeng/chart';
import { DashboardService, DashboardSummary, DepartmentStat, UserStat } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',

  // SOLUCIÓN ERROR 1 (continuación): NgClass agregado al array imports del componente.
  // Antes estaba así:  imports: [RouterLink, NgIf, NgFor, KeyValuePipe, ChartModule]
  // Ahora está así:    imports: [RouterLink, NgIf, NgFor, KeyValuePipe, NgClass, ChartModule]
  imports: [RouterLink, NgIf, NgFor, KeyValuePipe, NgClass, ChartModule],

  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashService = inject(DashboardService);
  private auth        = inject(AuthService);
  private router      = inject(Router);
  private cdr         = inject(ChangeDetectorRef);

  summary: DashboardSummary | null = null;
  departments: DepartmentStat[]    = [];
  users: UserStat[]                = [];
  loading = true;
  error   = '';

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
      next: (data: DepartmentStat[]) => this.departments = data,
      error: () => {}
    });
    this.dashService.getByUser().subscribe({
      next: (data: UserStat[]) => this.users = data,
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
      IN_PROGRESS: '#3b82f6',
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
