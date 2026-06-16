import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, KeyValuePipe, NgClass } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { ChartModule } from 'primeng/chart';
import { DashboardService, DashboardSummary, DepartmentStat, UserStat } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',


  imports: [RouterLink, NgIf, NgFor, KeyValuePipe, NgClass, ChartModule, NavbarComponent],

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
    // Colores coherentes con la paleta Nexora y con significado semantico:
    // Pendiente = slate neutro, En progreso = electric teal, Completado = verde exito
    const colors: Record<string, string> = {
      TO_DO:       '#6B7280',
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
