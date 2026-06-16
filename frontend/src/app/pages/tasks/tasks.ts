import { Component, inject, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { DragDropModule, CdkDragDrop, CdkDrag } from '@angular/cdk/drag-drop';
import { TasksService, Task, TasksResponse, TaskStatus, CreateTaskPayload, UpdateTaskPayload, EvaluateTaskPayload } from '../../services/tasks.service';
import { DepartmentsService, Department } from '../../services/departments.service';
import { UsersService, WorkerUser } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, NgIf, NgFor, SlicePipe, DragDropModule, NavbarComponent],
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

  get isAdmin()    { return this.auth.isAdmin(); }
  get isSuperUser(){ return this.auth.isSuperUser(); }

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

  // ── Estado del modal de detalle (tarjeta → click → modal) ──
  // viewingTask guarda la tarea cuya tarjeta fue clickeada (null = modal cerrado).
  // Muestra toda la información de la tarea y da acceso a las acciones existentes.
  viewingTask: Task | null = null;

  // ── Cierre con tecla Escape ──────────────────────────
  // Cierra el modal que esté abierto en este momento (detalle, edición o evaluación),
  // priorizando el que esté "más arriba" en caso de que varios estén abiertos.
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.evaluatingTask) { this.evaluatingTask = null; return; }
    if (this.editingTask)    { this.editingTask = null;    return; }
    if (this.viewingTask)    { this.viewingTask = null;    return; }
  }

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
        // Si el modal de detalle está abierto, refresca su referencia con los
        // datos nuevos para que no muestre información desactualizada.
        if (this.viewingTask) {
          this.viewingTask = this.tasks.find(t => t.id === this.viewingTask!.id) ?? null;
        }
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

    if (!title)                                                    this.createErrors['title']        = 'El título es requerido.';
    if (!description)                                            this.createErrors['description']  = 'La descripción es requerida.';
    if (!dueDate)                                                this.createErrors['dueDate']      = 'La fecha límite es requerida.';
    if (!this.createForm.departmentId || Number(this.createForm.departmentId) === 0)
                                                                 this.createErrors['departmentId'] = 'Selecciona un área de trabajo.';
    if (this.createForm.assignedToId == null)                    this.createErrors['assignedToId'] = 'Selecciona un usuario asignado.';

    if (Object.keys(this.createErrors).length > 0) {
      this.cdr.detectChanges();
      return;
    }

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

  // ── Abrir / cerrar modal de detalle ──────────────────
  // Se dispara al hacer click en una tarjeta. Muestra toda la información de la tarea.
  openView(task: Task) {
    this.viewingTask = task;
  }

  closeView() {
    this.viewingTask = null;
  }

  // ── Abrir modal de edición ───────────────────────────
  // Carga los datos actuales de la tarea en editForm para que el usuario los modifique.
  // Si se abre desde el modal de detalle, lo cierra para no apilar dos modales.
  openEdit(task: Task) {
    this.viewingTask = null;
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
  // VALIDACIÓN: bloquea el salto directo de TO_DO a DONE según criterios de aceptación.
  // Flujo permitido: TO_DO → IN_PROGRESS → DONE
  // Flujo bloqueado: TO_DO → DONE (se muestra mensaje de error y no se llama al backend)
  updateStatus(task: Task, status: string) {

    // Validación en el frontend: evitar pasar de TO_DO directo a DONE
    if (task.status === 'TO_DO' && status === 'DONE') {
      this.error = 'La tarea debe estar en proceso antes de marcarla como completada.';
      this.cdr.detectChanges();
      return; // se bloquea la acción, no se llama al backend
    }

    // Si pasa la validación, se envía el cambio al backend
    this.tasksService.update(task.id, { status: status as any }).subscribe({
      next: () => {
        this.error = ''; // limpia cualquier error previo al tener éxito
        this.load();
      },
      // Captura error 400 del backend (por si la validación también está en el servidor)
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Error al actualizar estado';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Tablero Kanban ────────────────────────────────────
  // Getters que dividen las tareas en las tres columnas del tablero
  // según su estado actual. Se recalculan en cada change detection,
  // por lo que siempre reflejan el contenido más reciente de `tasks`.
  get todoTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'TO_DO');
  }

  get inProgressTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'IN_PROGRESS');
  }

  // El backend ya filtra las tareas DONE para devolver solo las completadas hoy,
  // por lo que basta con mostrar todas las que llegan con status DONE.
  get doneTasks(): Task[] {
    return this.tasks.filter(t => t.status === 'DONE');
  }

  // IDs de las listas conectadas entre sí para permitir arrastrar
  // tarjetas de una columna a otra (cdkDropListConnectedTo).
  readonly kanbanListIds = ['kanban-todo', 'kanban-in-progress', 'kanban-done'];

  // ── Bloqueo visual de TO_DO → DONE en el drag & drop ──
  // cdkDropListEnterPredicate se evalúa mientras el usuario arrastra una tarjeta
  // sobre la columna "Terminadas": si la tarjeta viene de "Por Hacer", se rechaza
  // el ingreso (la tarjeta no se "engancha" a la columna y vuelve a su lugar al soltar),
  // respetando la misma regla de negocio que ya existe para el selector de estado.
  // Se declara como arrow function de instancia porque el CDK la invoca sin
  // contexto (`this` no apuntaría al componente si fuera un método normal).
  canEnterDoneColumn = (drag: CdkDrag<Task>): boolean => {
    const task = drag?.data;
    if (task?.status === 'TO_DO') {
      this.error = 'La tarea debe estar en proceso antes de marcarla como completada.';
      this.cdr.detectChanges();
      return false;
    }
    return true;
  };

  // Se dispara al soltar una tarjeta sobre una columna (misma columna o columna distinta).
  // Reutiliza la misma validación y lógica de `updateStatus` para mantener
  // consistencia con el cambio de estado por el <select>: bloquea TO_DO → DONE.
  onCardDrop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus) {
    const task: Task = event.item.data;

    // Si se soltó en la misma columna de origen, no hay cambio de estado.
    if (task.status === targetStatus) return;

    // Reutiliza updateStatus, que ya contiene la validación TO_DO → DONE bloqueada
    // y la llamada al backend + recarga de la lista.
    this.updateStatus(task, targetStatus);
  }

  // ── Eliminar tarea ───────────────────────────────────
  // Pide confirmación antes de borrar.
  // CAMBIO: el mensaje del confirm pasó de 'Delete this task?' a español.
  remove(id: number) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    this.viewingTask = null;
    this.tasksService.remove(id).subscribe({ next: () => this.load() });
  }

  // ── Abrir modal de evaluación ────────────────────────
  // Si la tarea ya tiene evaluación previa, la precarga en el formulario.
  // Si se abre desde el modal de detalle, lo cierra para no apilar dos modales.
  openEval(task: Task) {
    this.viewingTask = null;
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

  // ── Helper para traducir el estado de la tarea ───────
  // Se usa tanto en la tarjeta como en el modal de detalle.
  statusLabel(key: string): string {
    const map: Record<string, string> = {
      TO_DO:       'Pendiente',
      IN_PROGRESS: 'En progreso',
      DONE:        'Completado',
    };
    return map[key] ?? key;
  }

  // ── Helper para evitar que clicks en botones dentro de la tarjeta
  // disparen también la apertura del modal de detalle (stopPropagation manual
  // ya se usa en el HTML, este helper queda disponible si se requiere desde TS).
  stop(event: Event) {
    event.stopPropagation();
  }
}
