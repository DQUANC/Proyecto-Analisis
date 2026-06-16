import { Component, inject, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService, Task, EvaluateTaskPayload } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-history',
  imports: [ NgIf, NgFor, SlicePipe, NavbarComponent, FormsModule],
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

  get isAdmin() { return this.auth.isAdmin(); }

  viewingTask: Task | null = null;
  evaluatingTask: Task | null = null;
  evalForm: EvaluateTaskPayload = { feedback: '', score: undefined };

  openView(task: Task) { this.viewingTask = task; }
  closeView() { this.viewingTask = null; }

  openEval(task: Task) {
    this.viewingTask = null;
    this.evaluatingTask = task;
    this.evalForm = {
      feedback: task.evaluation?.feedback ?? '',
      score:    task.evaluation?.score    ?? undefined,
    };
  }

  submitEval() {
    if (!this.evaluatingTask) return;
    this.tasksService.evaluate(this.evaluatingTask.id, this.evalForm).subscribe({
      next: () => {
        this.evaluatingTask = null;
        this.tasksService.getHistory().subscribe({
          next: (res) => { this.tasks = res.tasks; this.cdr.detectChanges(); },
          error: () => {}
        });
      },
      error: (err: any) => { this.error = err?.error?.message ?? 'Error al evaluar'; this.cdr.detectChanges(); }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.evaluatingTask) { this.evaluatingTask = null; return; }
    this.viewingTask = null;
  }

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
