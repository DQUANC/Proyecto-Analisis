import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { TasksService, Task } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  imports: [RouterLink, NgIf, NgFor, SlicePipe],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class HistoryComponent implements OnInit {
  private tasksService = inject(TasksService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  loading = true;
  error = '';

  readonly isAdmin = this.auth.isAdmin();

  ngOnInit() {
    setTimeout(() => {
      this.tasksService.getHistory().subscribe({
        next: (res) => { this.tasks = res.tasks; this.loading = false; this.cdr.detectChanges(); },
        error: (err: any) => { this.error = err?.error?.message ?? 'Failed to load history'; this.loading = false; this.cdr.detectChanges(); }
      });
    });
  }

  // CAMBIO: reemplaza formatSeconds() que ya no se usa en la columna Tiempo Activo.
  // Lee directamente el campo activeTimeDays que provee el backend.
  // No calcula nada a partir de activeTimeSeconds — si activeTimeDays no viene,
  // muestra '0 días' según los criterios de aceptación.
  formatDays(days: number | null | undefined): string {
    if (days == null) return '0 días';
    if (days === 1) return '1 día';
    return `${days} días`;
  }

  // formatSeconds se mantiene por compatibilidad pero ya no se usa en el template
  formatSeconds(seconds: number | null): string {
    if (seconds === null) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  priorityLabel(key: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
    };
    return map[key] ?? key;
  }
}
