# Arquitectura del Sistema

## 1. Visión general

El sistema es un monorepo con dos aplicaciones independientes que se comunican por HTTP:

```
┌──────────────────────────────────────────────────────────────────┐
│                         MONOREPO                                 │
│                                                                  │
│  ┌──────────────────┐          ┌──────────────────────────────┐  │
│  │    FRONTEND       │  HTTP   │         BACKEND              │  │
│  │  Angular 17 SPA   │ ──────▶ │  Node.js + Express REST API  │  │
│  │  localhost:4200   │         │  localhost:3000              │  │
│  └──────────────────┘         └──────────────┬───────────────┘  │
│                                              │                  │
│                                              │ Prisma ORM       │
│                                              ▼                  │
│                                  ┌───────────────────┐         │
│                                  │    PostgreSQL      │         │
│                                  │    Base de datos   │         │
│                                  └───────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

El frontend es una **Single Page Application** que no conoce la base de datos. El backend expone una **REST API** que es el único punto de acceso a los datos.

---

## 2. Arquitectura del Backend

### Capas

```
Petición HTTP
     │
     ▼
┌─────────────┐
│   Routes    │  Define los endpoints y asigna middlewares
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Middleware │  Valida JWT, maneja errores globalmente
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │  Parsea la petición, llama al servicio, devuelve respuesta HTTP
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  Lógica de negocio pura (sin HTTP, sin framework)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Prisma ORM │  Acceso type-safe a PostgreSQL
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
└─────────────┘
```

### ¿Por qué esta separación en capas?

- **Routes**: punto único de entrada; fácil de leer qué endpoints existen y qué middlewares se aplican.
- **Controllers**: responsabilidad única — traducir HTTP ↔ dominio. No contienen lógica de negocio.
- **Services**: la lógica de negocio no sabe nada de Express ni de HTTP. Esto permite testear los services con Jest sin necesidad de levantar un servidor.
- **Prisma**: la capa de datos está encapsulada; si en el futuro se cambia de ORM o de motor de base de datos, sólo cambia esta capa.

---

## 3. Arquitectura del Frontend

### Estructura de módulos

```
src/app/
├── core/               ← servicios singleton, guards, interceptores
│   ├── guards/         → AuthGuard: protege rutas que requieren login
│   ├── interceptors/   → AuthInterceptor: agrega Bearer token a cada petición
│   └── services/       → AuthService, otros servicios globales
│
├── features/           ← módulos de funcionalidad (lazy loading)
│   ├── auth/           → login, registro
│   └── tasks/          → listado, creación, edición, eliminación
│
└── shared/             ← componentes y tipos reutilizables
    ├── components/     → botones, tarjetas, modales genéricos
    └── models/         → interfaces TypeScript (Task, User, etc.)
```

### ¿Por qué esta estructura?

- **Core**: los servicios de autenticación y los interceptores deben existir una sola vez en toda la app. Agruparlos en `core` comunica esa intención.
- **Features**: cada funcionalidad es un módulo lazy-loaded. Angular sólo descarga el código de `tasks` cuando el usuario navega a esa ruta, reduciendo el bundle inicial.
- **Shared**: evita duplicación. Un componente de tarjeta o un modelo `Task` definido una vez y usado en múltiples features.

---

## 4. Flujo de autenticación

```
Usuario                Angular                 Backend              DB
   │                      │                       │                  │
   │── Formulario login ──▶│                       │                  │
   │                      │── POST /api/auth/login▶│                  │
   │                      │                       │── SELECT user ──▶│
   │                      │                       │◀── user row ─────│
   │                      │                       │ bcrypt.compare()  │
   │                      │◀── { token, user } ───│                  │
   │                      │ localStorage.setItem() │                  │
   │                      │                       │                  │
   │── GET /tasks ────────▶│                       │                  │
   │                      │ AuthInterceptor agrega │                  │
   │                      │ Authorization: Bearer  │                  │
   │                      │── GET /api/tasks ─────▶│                  │
   │                      │                       │ authMiddleware    │
   │                      │                       │ jwt.verify()      │
   │                      │                       │── SELECT tasks ──▶│
   │                      │◀── [ tasks ] ─────────│◀── rows ─────────│
   │◀── Renderiza UI ─────│                       │                  │
```

---

## 5. Contrato de la API

### Autenticación (`/api/auth`)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | /api/auth/register | `{ email, password, name }` | `{ id, email, name }` |
| POST | /api/auth/login | `{ email, password }` | `{ token, user }` |

### Tareas (`/api/tasks`) — requieren `Authorization: Bearer <token>`

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | /api/tasks | — | `Task[]` |
| POST | /api/tasks | `{ title, description?, status?, priority?, dueDate? }` | `Task` |
| GET | /api/tasks/:id | — | `Task` |
| PUT | /api/tasks/:id | campos a actualizar | `Task` |
| DELETE | /api/tasks/:id | — | 204 No Content |

### Modelo Task

```typescript
interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;   // ISO 8601
  userId: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Consideraciones de seguridad

| Riesgo | Mitigación |
|--------|-----------|
| Contraseñas en texto plano | bcryptjs con factor de coste 10 |
| Tokens robados | JWT con expiración 24h; sin refresh token persistente en DB |
| Acceso a recursos de otro usuario | Todos los queries filtran por `userId` del token |
| Secretos en repositorio | `.env` en `.gitignore`; sólo `.env.example` se commitea |
| Peticiones cross-origin | CORS configurado en Express (restringir a dominio del frontend en prod) |
| Inyección SQL | Prisma usa prepared statements; no hay SQL dinámico |

---

## 7. Despliegue — Railway

Los tres servicios del proyecto se despliegan en un único proyecto de **Railway**:

```
                        RAILWAY PROJECT
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  task-manager-       │    │  task-manager-           │  │
│  │  frontend            │    │  backend                 │  │
│  │                      │    │                          │  │
│  │  Angular 17 (serve)  │───▶│  Node.js + Express       │  │
│  │  $PORT (Railway)     │    │  $PORT (Railway)         │  │
│  └──────────────────────┘    └────────────┬─────────────┘  │
│                                           │ Prisma ORM     │
│                              ┌────────────▼─────────────┐  │
│                              │  task-manager-db         │  │
│                              │  PostgreSQL 15 (plugin)  │  │
│                              │  DATABASE_URL auto        │  │
│                              └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

| Servicio | Directorio fuente | Tipo |
|---|---|---|
| `task-manager-frontend` | `/frontend` | GitHub repo (monorepo) |
| `task-manager-backend` | `/backend` | GitHub repo (monorepo) |
| `task-manager-db` | — | Plugin PostgreSQL de Railway |

Railway inyecta `DATABASE_URL` automáticamente desde el plugin de PostgreSQL al servicio de backend. El resto de variables se configuran manualmente en el panel de cada servicio.

### Archivos de configuración

Cada servicio tiene dos archivos que controlan el build y el arranque:

**`railway.json`**

| Servicio | `buildCommand` | `startCommand` |
|---|---|---|
| backend | `npm install && npm run build && npx prisma migrate deploy` | `npm run start` |
| frontend | `npm install && npm run build:prod` | `npx serve dist/task-manager-frontend/browser -l $PORT` |

**`nixpacks.toml`** — declara el entorno (Node.js 20) y las fases de build:

| Servicio | Fase build | Fase start |
|---|---|---|
| backend | `npm run build` + `npx prisma generate` | `npm run start` |
| frontend | `npm run build:prod` | `npx serve dist/task-manager-frontend/browser -l $PORT` |

### Variables de entorno en Railway

| Variable | Servicio | Origen |
|---|---|---|
| `DATABASE_URL` | backend | Inyectada automáticamente por el plugin PostgreSQL |
| `JWT_SECRET` | backend | Configurar manualmente en el panel de Railway |
| `PORT` | backend y frontend | Inyectada automáticamente por Railway |
| `FRONTEND_URL` | backend | URL del servicio frontend (para restringir CORS en producción) |

### Pipeline CI/CD (`.github/workflows/ci-cd.yml`)

Los jobs de CI (typecheck + build) corren en cada PR y en cada push a `main` o `develop`. El deploy **solo se ejecuta cuando se mergea un PR a `main`** (push a main con event_name == push).

```
PR abierto / push a develop
        │
        ▼
┌────────────────────────┐
│  Job 1: backend        │  PostgreSQL 15 (service container)
│  npm ci                │  tsc --noEmit (typecheck)
│  prisma migrate deploy │  npm test
└───────────┬────────────┘
            │ needs: backend
            ▼
┌────────────────────────┐
│  Job 2: frontend       │
│  npm ci                │
│  npm run build:prod    │
│  upload artifact dist/ │  retención 7 días
└───────────┬────────────┘
            │
            │   solo si: merge de PR → main
            ▼
┌────────────────────────────────┐
│  Job 3: deploy                 │
│  railway up --service backend  │
│  railway up --service frontend │
└────────────────────────────────┘
```

**GitHub Secrets requeridos:**

| Secret | Usado en |
|---|---|
| `DB_TEST_PASSWORD` | Job 1 — contraseña del contenedor PostgreSQL de pruebas |
| `JWT_TEST_KEY` | Job 1 — clave JWT para el entorno de test |
| `RAILWAY_TOKEN` | Job 3 — autenticación con Railway CLI para el deploy |
