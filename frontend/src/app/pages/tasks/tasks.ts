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
  private deptService  = inject(DepartmentsService);
  private usersService = inject(UsersService);
  private auth         = inject(AuthService);
  private router       = inject(Router);
  private cdr          = inject(ChangeDetectorRef);

  tasks: Task[]           = [];
  departments: Department[] = [];
  workers: WorkerUser[]   = [];
  loading = true;
  error   = '';

  // Determina si el usuario logueado es administrador.
  // Se usa en el HTML con *ngIf="isAdmin" para mostrar/ocultar botones y columnas.
  readonly isAdmin = this.auth.isAdmin();

  // ── Estado del formulario de creación ───────────────
  // showCreateForm controla si el formulario es visible o no.
  // createForm contiene los valores que el usuario escribe antes de enviar.
  showCreateForm = false;
  createErrors: Record<string, string> = {};
  createForm: CreateTaskPayload = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    departmentId: 0,
    assignedToId: undefined,
  };

  // ── Estado del modal de edición ─────────────────────
  // editingTask guarda la tarea que se está editando (null = modal cerrado).
  // editForm contiene los valores modificados antes de guardar.
  editingTask: Task | null      = null;
  editForm: UpdateTaskPayload   = {};

  // ── Estado del modal de evaluación ──────────────────
  // evaluatingTask guarda la tarea a evaluar (null = modal cerrado).
  // evalForm contiene puntaje y retroalimentación.
  evaluatingTask: Task | null         = null;
  evalForm: EvaluateTaskPayload       = { feedback: '', score: undefined };

  ngOnInit() {
    // setTimeout evita el error "ExpressionChangedAfterItHasBeenChecked"
    // que ocurre cuando se modifica el estado durante la inicialización del componente.
    setTimeout(() => {
      this.load();

      // Solo el admin necesita la lista de departamentos y trabajadores
      // (para los selects del formulario de creación/edición).
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

  // Carga la lista de tareas desde el servicio (API o mocks según entorno).
  load() {
    this.loading = true;
    this.tasksService.getAll().subscribe({
      next: (res: TasksResponse) => {
        this.tasks = res.tasks;
        this.loading = false;
        this.cdr.detectChanges(); // fuerza la actualización de la vista
      },
      // CAMBIO: mensaje de error traducido al español
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Error al cargar';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Crear tarea ──────────────────────────────────────
  // Se llama al enviar el formulario de nueva tarea.
  // Al terminar limpia el formulario y recarga la tabla.
  create() {
    this.createErrors = {};
    const title = this.createForm.title?.trim() ?? '';
    const description = this.createForm.description?.trim() ?? '';
    const dueDate = this.createForm.dueDate?.trim() ?? '';

    if (!title)                                      this.createErrors['title']        = 'El título es requerido.';
    if (!description)                                this.createErrors['description']  = 'La descripción es requerida.';
    if (!dueDate)                                    this.createErrors['dueDate']      = 'La fecha límite es requerida.';
    if (!this.createForm.departmentId)               this.createErrors['departmentId'] = 'Selecciona un área de trabajo.';
    if (this.createForm.assignedToId == null)        this.createErrors['assignedToId'] = 'Selecciona un usuario asignado.';

    if (Object.keys(this.createErrors).length > 0) return;

    this.tasksService.create({ ...this.createForm, title, description }).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.createErrors = {};
        this.createForm = { title: '', description: '', priority: 'MEDIUM', departmentId: 0, assignedToId: undefined };
        this.load();
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Error al crear';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Abrir modal de edición ───────────────────────────
  // Carga los datos actuales de la tarea en editForm para que el usuario los modifique.
  openEdit(task: Task) {
    this.editingTask = task;
    this.editForm = {
      title:        task.title,
      description:  task.description ?? '',
      priority:     task.priority,
      dueDate:      task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedToId: task.assignedToId ?? undefined,
    };
  }

  // Guarda los cambios del modal de edición y recarga la tabla.
  saveEdit() {
    if (!this.editingTask) return;
    this.tasksService.update(this.editingTask.id, this.editForm).subscribe({
      next: () => { this.editingTask = null; this.load(); },
      // CAMBIO: mensaje de error traducido
      error: (err: any) => { this.error = err?.error?.message ?? 'Error al actualizar'; }
    });
  }

  // ── Cambiar estado inline ────────────────────────────
  // Se dispara cuando el usuario cambia el <select> de estado en la tabla.
  // Envía solo el nuevo estado al backend sin abrir ningún modal.
  updateStatus(task: Task, status: string) {
    this.tasksService.update(task.id, { status: status as any }).subscribe({
      next: () => this.load(),
      // CAMBIO: mensaje de error traducido
      error: (err: any) => { this.error = err?.error?.message ?? 'Error al actualizar estado'; }
    });
  }

  // ── Eliminar tarea ───────────────────────────────────
  // Pide confirmación antes de borrar.
  // CAMBIO: el mensaje del confirm pasó de 'Delete this task?' a español.
  remove(id: number) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    this.tasksService.remove(id).subscribe({ next: () => this.load() });
  }

  // ── Abrir modal de evaluación ────────────────────────
  // Si la tarea ya tiene evaluación previa, la precarga en el formulario.
  openEval(task: Task) {
    this.evaluatingTask = task;
    this.evalForm = {
      feedback: task.evaluation?.feedback ?? '',
      score:    task.evaluation?.score    ?? undefined,
    };
  }

  // Guarda la evaluación (puntaje + retroalimentación) y cierra el modal.
  submitEval() {
    if (!this.evaluatingTask) return;
    this.tasksService.evaluate(this.evaluatingTask.id, this.evalForm).subscribe({
      next: () => { this.evaluatingTask = null; this.load(); },
      // CAMBIO: mensaje de error traducido
      error: (err: any) => { this.error = err?.error?.message ?? 'Error al evaluar'; }
    });
  }

  // ── Cerrar sesión ────────────────────────────────────
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ── CAMBIO: helper para traducir prioridades ─────────
  // El backend guarda y devuelve los valores en inglés (LOW/MEDIUM/HIGH).
  // Este método convierte ese valor al texto en español para mostrarlo en la tabla.
  // Se usa en el HTML así: {{ priorityLabel(t.priority) }}
  // De esta forma los colores CSS siguen funcionando con la clase original
  // (priority-low, priority-medium, priority-high) y el texto aparece en español.
  priorityLabel(key: string): string {
    const map: Record<string, string> = {
      LOW:    'Baja',
      MEDIUM: 'Media',
      HIGH:   'Alta',
    };
    // Si por alguna razón llega un valor desconocido, lo muestra tal cual
    return map[key] ?? key;
  }
}
