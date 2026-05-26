# TICKETS — Gestor de Tareas

---

## Resumen de Epics

| # | Epic | Semana | Responsable(s) | Estado |
|---|------|--------|---------------|--------|
| E1 | Infraestructura y DevOps base | 1 | DevOps | Completado |
| E2 | Autenticación | 1 | Backend + Frontend | Backend completado / Frontend pendiente |
| E3 | CRUD de Tareas | 2 | Backend + Frontend | Backend completado / Frontend pendiente |
| E4 | Filtros, Búsqueda y Ordenación | 3 | Backend + Frontend | Pendiente |
| E5 | Dashboard de Estadísticas | 3 | Backend + Frontend | Pendiente |
| E6 | Calidad, Deploy y Cierre | 4 | Todos | Pendiente |

---

## EPIC 1 — Infraestructura y DevOps base

### Story 1.1 — Repositorio y estructura del monorepo

**Como** equipo, **quiero** un repositorio con estructura de carpetas definida y pipeline de CI/CD **para** poder trabajar de forma independiente sin pisar el trabajo de los demás.

**Semana:** 1 | **Puntos:** L | **Responsable:** DevOps
**Estado:** ✅ Completado

#### Tasks
- [x] **[DEVOPS]** Crear estructura de monorepo (`backend/`, `frontend/`, `docs/`, `.github/`)
- [x] **[DEVOPS]** Configurar `.gitignore` para Node, Angular, `.env`, build artifacts
- [x] **[DEVOPS]** Crear `.github/CODEOWNERS` con responsables por directorio
- [x] **[DEVOPS]** Escribir `ci-cd.yml` con 3 jobs: backend-test, frontend-build, deploy a Railway
- [x] **[DEVOPS]** Crear `backend/railway.json` y `backend/nixpacks.toml`
- [x] **[DEVOPS]** Crear `frontend/railway.json` y `frontend/nixpacks.toml`
- [x] **[DEVOPS]** Documentar `docs/TECHNOLOGIES.md`, `docs/ARCHITECTURE.md`, `README.md`

---

### Story 1.2 — Conexión frontend ↔ backend

**Como** desarrollador, **quiero** que Angular pueda hacer peticiones HTTP al backend local **para** poder integrar ambas capas durante el desarrollo.

**Semana:** 1 | **Puntos:** M | **Responsable:** Frontend
**Depende de:** Story 1.1
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Verificar `environment.ts` con `apiUrl: 'http://localhost:3000/api'` (`frontend/src/environments/environment.ts`)
- [ ] **[FRONTEND]** Crear `AuthInterceptor` en `frontend/src/app/core/interceptors/auth.interceptor.ts` que agregue el header `Authorization: Bearer <token>` a todas las peticiones salientes
- [ ] **[FRONTEND]** Registrar el interceptor en `app.config.ts` usando `withInterceptors([authInterceptor])`
- [ ] **[FRONTEND]** Crear interfaces TypeScript en `frontend/src/app/shared/models/`: `task.model.ts` (interface `Task`) y `auth.model.ts` (interfaces `LoginRequest`, `RegisterRequest`, `AuthResponse`)
- [ ] **[BACKEND]** Verificar que CORS en `backend/src/app.ts` acepta `http://localhost:4200` como origen

---

## EPIC 2 — Autenticación

### Story 2.1 — Registro de usuario (Backend)

**Como** nuevo usuario, **quiero** crear una cuenta con email y contraseña **para** acceder a la aplicación.

**Semana:** 1 | **Puntos:** S | **Responsable:** Backend
**Estado:** ✅ Completado (servicio implementado; falta validación de inputs)

#### Tasks
- [x] **[BACKEND]** Implementar `AuthService.register()` en `backend/src/services/auth.service.ts` (bcrypt hash + Prisma create)
- [x] **[BACKEND]** Conectar ruta `POST /api/auth/register` en `backend/src/routes/auth.routes.ts`
- [ ] **[BACKEND]** Instalar Zod (`npm install zod`) y crear `backend/src/schemas/auth.schema.ts` con validación: email formato, password mínimo 8 caracteres, name no vacío
- [ ] **[BACKEND]** Crear `backend/src/middleware/validate.middleware.ts` y aplicarlo en la ruta `/register`
- [ ] **[BACKEND]** Correr primera migración: `npm run prisma:migrate` con base de datos configurada

---

### Story 2.2 — Inicio de sesión (Backend)

**Como** usuario registrado, **quiero** iniciar sesión con mi email y contraseña **para** recibir un JWT y acceder a mis tareas.

**Semana:** 1 | **Puntos:** S | **Responsable:** Backend
**Estado:** ✅ Completado (servicio implementado; falta validación de inputs)

#### Tasks
- [x] **[BACKEND]** Implementar `AuthService.login()` en `backend/src/services/auth.service.ts` (bcrypt compare + jwt.sign con expiración 24h)
- [x] **[BACKEND]** Conectar ruta `POST /api/auth/login` en `backend/src/routes/auth.routes.ts`
- [x] **[BACKEND]** Proteger `JWT_SECRET` con patrón fail-fast en `auth.middleware.ts` y `auth.service.ts` (IIFE que lanza si la variable no está definida)
- [ ] **[BACKEND]** Aplicar schema Zod de validación en la ruta `/login`

---

### Story 2.3 — Registro e inicio de sesión (Frontend)

**Como** usuario, **quiero** ver formularios de registro e inicio de sesión **para** poder acceder a la aplicación desde el navegador.

**Semana:** 1 | **Puntos:** L | **Responsable:** Frontend
**Depende de:** Story 2.1, Story 2.2, Story 1.2
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Crear `AuthService` en `frontend/src/app/core/services/auth.service.ts`:
  - `login(email, password)` → POST /api/auth/login → guarda token en `localStorage`
  - `register(email, password, name)` → POST /api/auth/register
  - `logout()` → elimina token de `localStorage`, navega a `/auth/login`
  - `isAuthenticated()` → `boolean`
  - `getToken()` → `string | null`
- [ ] **[FRONTEND]** Crear `LoginComponent` en `frontend/src/app/features/auth/login/login.component.ts` — formulario reactivo con campos email y password, botón submit, enlace a registro, mensaje de error si falla
- [ ] **[FRONTEND]** Crear `RegisterComponent` en `frontend/src/app/features/auth/register/register.component.ts` — formulario reactivo con campos email, password, name; navega a `/auth/login` al completar
- [ ] **[FRONTEND]** Actualizar `frontend/src/app/features/auth/auth.routes.ts` con rutas `/auth/login` y `/auth/register`
- [ ] **[FRONTEND]** Usar Angular Material: `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatCardModule`

---

### Story 2.4 — Protección de rutas y cierre de sesión (Frontend)

**Como** usuario no autenticado, **quiero** ser redirigido al login si intento acceder a mis tareas **para** que mis datos estén protegidos.

**Semana:** 1 | **Puntos:** S | **Responsable:** Frontend
**Depende de:** Story 2.3
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Crear `AuthGuard` en `frontend/src/app/core/guards/auth.guard.ts` — si no hay token en `localStorage` redirige a `/auth/login`
- [ ] **[FRONTEND]** Aplicar `canActivate: [AuthGuard]` sobre la ruta `/tasks` en `frontend/src/app/app.routes.ts`
- [ ] **[FRONTEND]** Agregar botón "Cerrar sesión" en la barra de navegación que llame a `AuthService.logout()`

---

## EPIC 3 — CRUD de Tareas

### Story 3.1 — CRUD de tareas (Backend)

**Como** usuario autenticado, **quiero** crear, ver, editar y eliminar mis tareas vía API **para** que el frontend pueda consumirlas.

**Semana:** 2 | **Puntos:** S | **Responsable:** Backend
**Depende de:** Story 2.1
**Estado:** ✅ Completado (servicio implementado; falta validación de inputs)

#### Tasks
- [x] **[BACKEND]** Implementar `TaskService` en `backend/src/services/tasks.service.ts`: `getAll`, `getById`, `create`, `update`, `remove` — todos filtran por `userId` del token
- [x] **[BACKEND]** Conectar rutas CRUD en `backend/src/routes/tasks.routes.ts` protegidas por `authMiddleware`
- [x] **[BACKEND]** Verificar que `DELETE /api/tasks/:id` retorna 204 No Content
- [x] **[BACKEND]** Verificar que acceso a tarea de otro usuario retorna 404 (no filtrar por userId en el error)
- [ ] **[BACKEND]** Crear `backend/src/schemas/task.schema.ts` con validación Zod: `title` (max 200 chars), `status` (enum), `priority` (enum), `dueDate` (ISO string opcional)
- [ ] **[BACKEND]** Aplicar validate middleware en `POST /api/tasks` y `PUT /api/tasks/:id`

---

### Story 3.2 — Listado de tareas (Frontend)

**Como** usuario, **quiero** ver todas mis tareas en una lista **para** tener visibilidad de lo que tengo pendiente.

**Semana:** 2 | **Puntos:** L | **Responsable:** Frontend
**Depende de:** Story 3.1, Story 2.3
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Crear `TaskService` en `frontend/src/app/core/services/task.service.ts`:
  - `getAll()` → GET /api/tasks → `Observable<Task[]>`
  - `getById(id)` → GET /api/tasks/:id
  - `create(data)` → POST /api/tasks
  - `update(id, data)` → PUT /api/tasks/:id
  - `delete(id)` → DELETE /api/tasks/:id
- [ ] **[FRONTEND]** Crear `TaskListComponent` en `frontend/src/app/features/tasks/task-list/task-list.component.ts` — llama a `TaskService.getAll()` en `ngOnInit`, muestra la lista con `@for`
- [ ] **[FRONTEND]** Crear `TaskCardComponent` en `frontend/src/app/features/tasks/task-card/task-card.component.ts` — muestra título, estado (chip de color), prioridad (badge), fecha límite formateada, botones Editar y Eliminar
- [ ] **[FRONTEND]** Actualizar `frontend/src/app/features/tasks/tasks.routes.ts` con ruta `/tasks` → `TaskListComponent`
- [ ] **[FRONTEND]** Usar Angular Material: `MatCardModule`, `MatChipsModule`, `MatIconModule`, `MatButtonModule`

---

### Story 3.3 — Crear y editar tarea (Frontend)

**Como** usuario, **quiero** un formulario para crear y editar tareas **para** gestionar mi trabajo.

**Semana:** 2 | **Puntos:** L | **Responsable:** Frontend
**Depende de:** Story 3.2
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Crear `TaskFormComponent` en `frontend/src/app/features/tasks/task-form/task-form.component.ts` — formulario reactivo reutilizable para crear y editar:
  - Campo `title` (requerido, max 200)
  - Campo `description` (textarea, opcional)
  - Select `status` con opciones PENDING / IN_PROGRESS / DONE
  - Select `priority` con opciones LOW / MEDIUM / HIGH
  - Date picker `dueDate` (opcional, usando `MatDatepickerModule`)
- [ ] **[FRONTEND]** Agregar ruta `/tasks/new` → `TaskFormComponent` (modo crear) en `tasks.routes.ts`
- [ ] **[FRONTEND]** Agregar ruta `/tasks/:id/edit` → `TaskFormComponent` (modo editar, precarga datos) en `tasks.routes.ts`
- [ ] **[FRONTEND]** Agregar botón "Nueva tarea" en `TaskListComponent` que navega a `/tasks/new`
- [ ] **[FRONTEND]** En modo editar: obtener tarea con `TaskService.getById(id)` y parchear el formulario

---

### Story 3.4 — Eliminar tarea (Frontend)

**Como** usuario, **quiero** eliminar una tarea con confirmación **para** no borrar algo por error.

**Semana:** 2 | **Puntos:** S | **Responsable:** Frontend
**Depende de:** Story 3.2
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** En `TaskCardComponent`, el botón Eliminar abre un `MatDialog` de confirmación
- [ ] **[FRONTEND]** Al confirmar, llama a `TaskService.delete(id)` y remueve la tarea del array local sin recargar la página

---

### Story 3.5 — Cambiar estado de tarea (Frontend)

**Como** usuario, **quiero** cambiar el estado de una tarea directamente desde la lista **para** actualizar mi progreso sin abrir el formulario de edición.

**Semana:** 2 | **Puntos:** S | **Responsable:** Frontend
**Depende de:** Story 3.2
**Estado:** ⬜ Pendiente

> **Implementabilidad:** ✅ El backend ya soporta cambio de estado vía `PUT /api/tasks/:id` con el campo `status`. No requiere endpoint adicional.

#### Tasks
- [ ] **[FRONTEND]** En `TaskCardComponent`, agregar un select o grupo de botones que muestre el estado actual y permita cambiarlo
- [ ] **[FRONTEND]** Al cambiar el estado, llamar `TaskService.update(id, { status: newStatus })` y actualizar el card inmediatamente (optimistic update)

---

## EPIC 4 — Filtros, Búsqueda y Ordenación

### Story 4.1 — Filtros y ordenación (Backend)

**Como** usuario, **quiero** que el endpoint `GET /api/tasks` acepte parámetros de filtro y ordenación **para** que el frontend pueda mostrar subconjuntos de tareas.

**Semana:** 3 | **Puntos:** M | **Responsable:** Backend
**Depende de:** Story 3.1
**Estado:** ⬜ Pendiente

> **Implementabilidad:** ✅ El backend actual retorna todas las tareas sin filtrar. Requiere modificar `TaskService.getAll()` para aceptar query params y construir el `where`/`orderBy` de Prisma dinámicamente.

#### Tasks
- [ ] **[BACKEND]** Modificar `TaskService.getAll(userId, filters)` en `backend/src/services/tasks.service.ts` para aceptar: `status?: TaskStatus`, `priority?: Priority`, `search?: string`, `sort?: 'dueDate' | 'createdAt'`
- [ ] **[BACKEND]** Modificar `tasks.controller.ts` para leer query params (`req.query`) y pasarlos al servicio
- [ ] **[BACKEND]** Agregar filtro `title: { contains: search, mode: 'insensitive' }` en la query de Prisma cuando `search` está presente
- [ ] **[BACKEND]** Agregar `orderBy: { dueDate: 'asc' }` cuando `sort=dueDate`

---

### Story 4.2 — Filtros, búsqueda y ordenación (Frontend)

**Como** usuario, **quiero** filtrar mis tareas por estado y prioridad, buscar por título y ordenarlas por fecha límite **para** encontrar rápidamente lo que necesito.

**Semana:** 3 | **Puntos:** L | **Responsable:** Frontend
**Depende de:** Story 4.1, Story 3.2
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Agregar barra de filtros encima de la lista en `TaskListComponent`: select de estado, select de prioridad, campo de búsqueda (text input), botón "ordenar por fecha límite"
- [ ] **[FRONTEND]** Al cambiar cualquier filtro, llamar `TaskService.getAll({ status, priority, search, sort })` con los query params
- [ ] **[FRONTEND]** Actualizar `TaskService.getAll()` para aceptar un objeto opcional de filtros y construir los query params en la URL: `GET /api/tasks?status=PENDING&priority=HIGH&search=texto&sort=dueDate`
- [ ] **[FRONTEND]** Usar Angular Material: `MatSelectModule`, `MatInputModule`, `MatButtonToggleModule`
- [ ] **[FRONTEND]** Mostrar estado vacío ("No hay tareas que coincidan") si el array retornado está vacío

---

## EPIC 5 — Dashboard de Estadísticas

### Story 5.1 — Endpoint de estadísticas (Backend)

**Como** sistema, **quiero** un endpoint que retorne conteos de tareas por estado **para** que el frontend pueda mostrar un dashboard.

**Semana:** 3 | **Puntos:** S | **Responsable:** Backend
**Depende de:** Story 3.1
**Estado:** ⬜ Pendiente

> **Implementabilidad:** ✅ Prisma soporta `groupBy` o múltiples `count` con `where`. No requiere cambios de schema.
> ⚠️ **Cuidado con el orden de rutas:** La ruta `GET /api/tasks/stats` debe registrarse ANTES de `GET /api/tasks/:id` en `tasks.routes.ts`, o Express interpretará `stats` como un valor de `:id`.

#### Tasks
- [ ] **[BACKEND]** Agregar método `getStats(userId)` en `backend/src/services/tasks.service.ts`:
  ```typescript
  return {
    total: await prisma.task.count({ where: { userId } }),
    pending: await prisma.task.count({ where: { userId, status: 'PENDING' } }),
    inProgress: await prisma.task.count({ where: { userId, status: 'IN_PROGRESS' } }),
    done: await prisma.task.count({ where: { userId, status: 'DONE' } }),
  }
  ```
- [ ] **[BACKEND]** Agregar `getStats` en `backend/src/controllers/tasks.controller.ts`
- [ ] **[BACKEND]** Registrar `GET /api/tasks/stats` en `tasks.routes.ts` **antes** de `GET /api/tasks/:id`

---

### Story 5.2 — Dashboard visual (Frontend)

**Como** usuario, **quiero** ver un resumen con conteos de mis tareas por estado **para** entender mi progreso de un vistazo.

**Semana:** 3 | **Puntos:** M | **Responsable:** Frontend
**Depende de:** Story 5.1, Story 3.2
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Agregar `getStats()` en `TaskService` → GET /api/tasks/stats → `Observable<TaskStats>`
- [ ] **[FRONTEND]** Crear `DashboardComponent` en `frontend/src/app/features/tasks/dashboard/dashboard.component.ts` con 4 tarjetas: Total, Pendientes, En progreso, Completadas
- [ ] **[FRONTEND]** Agregar ruta `/tasks/dashboard` en `tasks.routes.ts` y enlace en la barra de navegación
- [ ] **[FRONTEND]** Usar Angular Material: `MatCardModule`, colores semánticos (warn para pendientes, primary para en progreso, accent para completadas)

---

## EPIC 6 — Calidad, Deploy y Cierre

### Story 6.1 — Configuración de base de datos en Railway

**Como** DevOps, **quiero** conectar la base de datos PostgreSQL en Railway y correr las migraciones **para** que el backend funcione en producción.

**Semana:** 4 | **Puntos:** M | **Responsable:** DevOps
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[DEVOPS]** Crear cuenta en Railway y nuevo proyecto
- [ ] **[DEVOPS]** Agregar servicio `task-manager-backend` apuntando al directorio `/backend` del monorepo
- [ ] **[DEVOPS]** Agregar servicio `task-manager-frontend` apuntando al directorio `/frontend`
- [ ] **[DEVOPS]** Agregar plugin PostgreSQL 15 al proyecto de Railway
- [ ] **[DEVOPS]** Vincular `DATABASE_URL` del plugin al servicio backend
- [ ] **[DEVOPS]** Configurar variables manuales en el servicio backend: `JWT_SECRET`, `FRONTEND_URL` (URL del servicio frontend)
- [ ] **[DEVOPS]** Registrar los 3 GitHub Secrets: `DB_TEST_PASSWORD`, `JWT_TEST_KEY`, `RAILWAY_TOKEN`
- [ ] **[DEVOPS]** Verificar que `npx prisma migrate deploy` corre correctamente en el primer deploy
- [ ] **[DEVOPS]** Agregar campo `"engines": { "node": ">=20" }` en `backend/package.json`

---

### Story 6.2 — Pruebas de integración (Backend)

**Como** equipo, **quiero** tests automatizados para los endpoints críticos **para** que el pipeline de CI detecte regresiones.

**Semana:** 4 | **Puntos:** XL | **Responsable:** Backend
**Depende de:** Story 2.2, Story 3.1
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[BACKEND]** Instalar Jest + ts-jest: `npm install --save-dev jest ts-jest @types/jest supertest @types/supertest`
- [ ] **[BACKEND]** Configurar `jest.config.ts` en `backend/`
- [ ] **[BACKEND]** Actualizar script `"test": "jest"` en `backend/package.json`
- [ ] **[BACKEND]** Escribir test: `POST /api/auth/register` con email duplicado → 409
- [ ] **[BACKEND]** Escribir test: `POST /api/auth/login` con credenciales inválidas → 401
- [ ] **[BACKEND]** Escribir test: `GET /api/tasks` sin token → 401
- [ ] **[BACKEND]** Escribir test: `GET /api/tasks/:id` de tarea de otro usuario → 404

---

### Story 6.3 — Revisión de diseño y UX (Frontend)

**Como** usuario, **quiero** una interfaz coherente, responsiva y fácil de usar **para** que la experiencia sea agradable.

**Semana:** 4 | **Puntos:** L | **Responsable:** Frontend
**Depende de:** Stories 2.3, 3.2, 3.3, 4.2, 5.2
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[FRONTEND]** Crear barra de navegación global (`NavbarComponent`) con el nombre del usuario autenticado y botón Logout
- [ ] **[FRONTEND]** Verificar que la app es responsiva en mobile (Angular Material es responsivo por defecto, revisar layouts con `fxLayout` o CSS Grid)
- [ ] **[FRONTEND]** Agregar `MatSnackBar` para notificaciones de éxito/error en operaciones CRUD
- [ ] **[FRONTEND]** Agregar estado de carga (`MatProgressSpinnerModule`) mientras se espera respuesta del servidor
- [ ] **[FRONTEND]** Verificar que todos los formularios muestran mensajes de error de validación claros
- [ ] **[FRONTEND]** Actualizar `environment.prod.ts` con la URL del backend en Railway

---

### Story 6.4 — Despliegue completo y smoke tests

**Como** equipo, **quiero** que el sistema completo funcione en Railway **para** poder presentar el proyecto funcionando en producción.

**Semana:** 4 | **Puntos:** M | **Responsable:** DevOps + todos
**Depende de:** Story 6.1, Story 6.3
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[DEVOPS]** Verificar que el pipeline de GitHub Actions pasa en verde en la rama `main`
- [ ] **[DEVOPS]** Confirmar que el deploy automático a Railway se dispara correctamente
- [ ] **[TODOS]** Smoke test en producción:
  - [ ] Registrar usuario nuevo
  - [ ] Login y recepción de JWT
  - [ ] Crear, editar, cambiar estado y eliminar tarea
  - [ ] Verificar filtros y búsqueda
  - [ ] Verificar dashboard
  - [ ] Verificar que no hay errores de CORS

---

### Story 6.5 — Documentación y presentación

**Como** equipo, **quiero** documentación técnica actualizada y una presentación preparada **para** el cierre del proyecto universitario.

**Semana:** 4 | **Puntos:** M | **Responsable:** Todos
**Estado:** ⬜ Pendiente

#### Tasks
- [ ] **[DEVOPS]** Actualizar `README.md` con la URL de producción en Railway
- [ ] **[DEVOPS]** Actualizar `implementation-report.md` marcando todas las fases completadas
- [ ] **[TODOS]** Preparar slides de presentación con: arquitectura, stack, demo en vivo, decisiones técnicas, dificultades encontradas
- [ ] **[TODOS]** Grabar o preparar demo de la app funcionando en Railway como respaldo si falla la conexión en vivo

---

## Análisis de implementabilidad

### ✅ Features directamente implementables (backend ya hecho)

| Feature | Por qué es inmediato |
|---------|---------------------|
| Registro de usuario | `AuthService.register()` implementado; solo falta Zod + migración |
| Login con JWT | `AuthService.login()` implementado; solo falta Zod |
| Protección de rutas (backend) | `authMiddleware` completamente implementado |
| CRUD de tareas | `TaskService` completamente implementado |
| Cambio de estado | Cubierto por `PUT /api/tasks/:id` con campo `status` |
| Asignar prioridad | Campo `priority` ya en schema y service |
| Asignar fecha límite | Campo `dueDate` ya en schema y service |

### ⚠️ Features que requieren trabajo adicional

| Feature | Qué falta |
|---------|----------|
| Filtrar/ordenar tareas | Modificar `TaskService.getAll()` para aceptar query params |
| Buscador por título | Agregar filtro `contains` en Prisma query |
| Dashboard de estadísticas | Nuevo endpoint `GET /api/tasks/stats` |
| Validación de inputs | Instalar Zod + crear schemas + middleware |
| Todo el frontend | Capa de UI completa por implementar |

### ❌ Features descartadas — fuera del alcance (confirmado)

Estas features del archivo `features.md` (sección "Features descartadas") no están en el scope del proyecto y no tienen tickets:

- Subtareas, tablero Kanban, notificaciones, colaboración, comentarios, historial de cambios, exportar a PDF/Excel, modo oscuro, categorías/etiquetas, perfil de usuario (foto, cambio de contraseña)

---

## Orden de implementación recomendado

```
Semana 1
  DevOps:   Story 1.1 ✅ → Story 6.1 (Railway)
  Backend:  Story 2.1 + 2.2 (completar Zod) → primera migración
  Frontend: Story 1.2 → Story 2.3 → Story 2.4

Semana 2
  Backend:  Story 3.1 (completar Zod)
  Frontend: Story 3.2 → Story 3.3 → Story 3.4 → Story 3.5

Semana 3
  Backend:  Story 4.1 → Story 5.1
  Frontend: Story 4.2 → Story 5.2

Semana 4
  Backend:  Story 6.2 (tests)
  Frontend: Story 6.3 (UX + prod environment)
  DevOps:   Story 6.4 (deploy completo)
  Todos:    Story 6.5 (documentación + presentación)
```
