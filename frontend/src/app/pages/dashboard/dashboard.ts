import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, KeyValuePipe } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardService, DashboardSummary, DepartmentStat, UserStat } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgIf, NgFor, KeyValuePipe, ChartModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashService = inject(DashboardService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  summary: DashboardSummary | null = null;
  departments: DepartmentStat[] = [];
  users: UserStat[] = [];
  loading = true;
  error = '';

  chartData: any = null;
  chartOptions: any = {
    plugins: {
      legend: { position: 'bottom' },
    },
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
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Failed to load (admin only)';
        this.loading = false;
        this.cdr.markForCheck();
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
    const statusLabels: Record<string, string> = {
      TO_DO: 'To Do',
      IN_PROGRESS: 'In Progress',
      DONE: 'Done',
    };
    const colors: Record<string, string> = {
      TO_DO:       '#94a3b8',
      IN_PROGRESS: '#f59e0b',
      DONE:        '#22c55e',
    };

    const labels = Object.keys(data.tasksByStatus).map(k => statusLabels[k] ?? k);
    const values = Object.values(data.tasksByStatus);
    const bgColors = Object.keys(data.tasksByStatus).map(k => colors[k] ?? '#6366f1');

    this.chartData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: bgColors,
        hoverOffset: 8,
      }],
    };
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
