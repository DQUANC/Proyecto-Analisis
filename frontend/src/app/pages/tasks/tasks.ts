import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import {
  TasksService, Task, TasksResponse,
  CreateTaskPayload, UpdateTaskPayload, EvaluateTaskPayload
} from '../../services/tasks.service';
import { DepartmentsService, Department } from '../../services/departments.service';
import { UsersService, WorkerUser } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, RouterLink, NgIf, NgFor, SlicePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class TasksComponent implements OnInit {
  private tasksService = inject(TasksService);
  private deptService = inject(DepartmentsService);
  private usersService = inject(UsersService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  departments: Department[] = [];
  workers: WorkerUser[] = [];
  loading = true;
  error = '';

  readonly isAdmin = this.auth.isAdmin();

  // Create form
  showCreateForm = false;
  createForm: CreateTaskPayload = { title: '', description: '', priority: 'MEDIUM', departmentId: 0, assignedToId: undefined };

  // Edit form
  editingTask: Task | null = null;
  editForm: UpdateTaskPayload = {};

  // Evaluation modal
  evaluatingTask: Task | null = null;
  evalForm: EvaluateTaskPayload = { feedback: '', score: undefined };

  ngOnInit() {
    setTimeout(() => {
      this.load();
      if (this.isAdmin) {
        this.deptService.getAll().subscribe({
          next: (res) => this.departments = res.departments,
          error: () => {}
        });
        this.usersService.getWorkers().subscribe({
          next: (res) => this.workers = res.users,
          error: () => {}
        });
      }
    });
  }

  load() {
    this.loading = true;
    this.tasksService.getAll().subscribe({
      next: (res: TasksResponse) => { this.tasks = res.tasks; this.loading = false; this.cdr.detectChanges(); },
      error: (err: any) => { this.error = err?.error?.message ?? 'Failed to load'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  // ── Create ──────────────────────────────────────────
  create() {
    this.tasksService.create(this.createForm).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.createForm = { title: '', description: '', priority: 'MEDIUM', departmentId: 0, assignedToId: undefined };
        this.load();
      },
      error: (err: any) => { this.error = err?.error?.message ?? 'Failed to create'; }
    });
  }

  // ── Edit ────────────────────────────────────────────
  openEdit(task: Task) {
    this.editingTask = task;
    this.editForm = {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedToId: task.assignedToId ?? undefined,
    };
  }

  saveEdit() {
    if (!this.editingTask) return;
    this.tasksService.update(this.editingTask.id, this.editForm).subscribe({
      next: () => { this.editingTask = null; this.load(); },
      error: (err: any) => { this.error = err?.error?.message ?? 'Failed to update'; }
    });
  }

  // ── Status (inline, both roles) ─────────────────────
  updateStatus(task: Task, status: string) {
    this.tasksService.update(task.id, { status: status as any }).subscribe({
      next: () => this.load(),
      error: (err: any) => { this.error = err?.error?.message ?? 'Failed to update status'; }
    });
  }

  // ── Delete ──────────────────────────────────────────
  remove(id: number) {
    if (!confirm('Delete this task?')) return;
    this.tasksService.remove(id).subscribe({ next: () => this.load() });
  }

  // ── Evaluate ────────────────────────────────────────
  openEval(task: Task) {
    this.evaluatingTask = task;
    this.evalForm = {
      feedback: task.evaluation?.feedback ?? '',
      score: task.evaluation?.score ?? undefined,
    };
  }

  submitEval() {
    if (!this.evaluatingTask) return;
    this.tasksService.evaluate(this.evaluatingTask.id, this.evalForm).subscribe({
      next: () => { this.evaluatingTask = null; this.load(); },
      error: (err: any) => { this.error = err?.error?.message ?? 'Failed to evaluate'; }
    });
  }

  // ── Helpers ─────────────────────────────────────────
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
