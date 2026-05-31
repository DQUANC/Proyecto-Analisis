# Proyecto Análisis — Gestor de Tareas Interno

Sistema de gestión de tareas para uso interno empresarial. Permite registrar, asignar, monitorear y evaluar tareas entre trabajadores, con visibilidad segmentada por departamento y herramientas de seguimiento para administradores.

Deployado completamente en **Railway** (frontend, backend y base de datos).

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL (via Prisma ORM) |
| Autenticación | JWT |
| Deploy | Railway |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                     Railway                         │
│                                                     │
│  ┌──────────────┐     HTTP/REST     ┌────────────┐  │
│  │   Frontend   │ ────────────────► │  Backend   │  │
│  │   (Angular)  │ ◄──────────────── │  (Node.js) │  │
│  └──────────────┘                   └─────┬──────┘  │
│                                           │         │
│                                     Prisma ORM      │
│                                           │         │
│                                    ┌──────▼──────┐  │
│                                    │ PostgreSQL  │  │
│                                    │     DB      │  │
│                                    └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

El frontend Angular consume la API REST del backend. El backend gestiona la autenticación mediante JWT y controla el acceso por roles y departamentos antes de responder a cualquier solicitud. Prisma actúa como ORM para las operaciones con la base de datos PostgreSQL.

---

## Funcionalidades Principales

- **Registro y asignación de tareas** — Crear tareas con título, descripción, fecha límite y departamento, asignables a uno o varios trabajadores.
- **Estados de tareas** — `Pendiente`, `En progreso`, `Finalizada`, con historial de cambios trazable.
- **Visibilidad por departamento** — Los usuarios solo ven las tareas de su departamento; los administradores tienen acceso total.
- **Timer de tarea activa** — Registro del tiempo transcurrido desde que una tarea entra en estado `En progreso`.
- **Historial de tareas finalizadas** — Vista dedicada con filtros por fecha, departamento y responsable.
- **Feedback y evaluación** — Los administradores pueden agregar comentarios y calificaciones a tareas finalizadas (solo visible para admin).
- **Dashboards** — Gráficas de tareas pendientes vs. finalizadas, distribución por departamento y tareas por responsable.

---

## Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total: todas las tareas, departamentos, feedback, evaluaciones y dashboards. |
| `worker` | Acceso a sus propias tareas y las de su departamento. |

---

## Estructura del Repositorio

```
Proyecto-Analisis/
├── backend/          # API REST en Node.js + Express + TypeScript
│   ├── prisma/       # Schema y migraciones de la base de datos
│   └── src/          # Código fuente del backend
└── frontend/         # Aplicación Angular
    └── src/          # Código fuente del frontend
```

---

## Variables de Entorno

El proyecto requiere las siguientes variables de entorno configuradas en Railway:

```env
DATABASE_URL=       # URL de conexión a PostgreSQL
JWT_SECRET=         # Clave secreta para firma de tokens JWT
```
