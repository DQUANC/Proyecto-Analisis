# Task Manager

Sistema interno de gestión de tareas para empresas. Permite registrar, asignar, monitorear y evaluar tareas entre trabajadores, con visibilidad segmentada por departamento y herramientas de seguimiento para administradores.

## Roles

| Rol | Permisos |
|---|---|
| `ADMIN` | Crear, editar, eliminar y evaluar tareas. Ver todos los departamentos. Acceso al dashboard. |
| `WORKER` | Ver y actualizar el estado de sus tareas asignadas y las de su departamento. |

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 17 (standalone components) + Angular Material |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT |
| Deploy | Railway (frontend + backend + DB) |

---

## Requisitos previos

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (para desarrollo local)

---

## Setup local

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd proyecto-analisis
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editar `.env` con tus valores locales:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/taskmanager"
JWT_SECRET="una_clave_secreta_de_al_menos_32_caracteres"
JWT_EXPIRES_IN="8h"
PORT=3000
FRONTEND_URL="http://localhost:4200"
```

```bash
# Crear la base de datos y correr migraciones
npx prisma migrate dev --name init

# Iniciar el servidor en modo desarrollo (hot reload)
npm run dev
# API disponible en: http://localhost:3000
# Health check: GET http://localhost:3000/health
```

### 3. Frontend

```bash
# En otra terminal, desde la raíz del repo
cd frontend
npm install
npm start
# App disponible en: http://localhost:4200
```

### Scripts útiles

```bash
# Backend
npm run dev          # Servidor con hot reload (nodemon)
npm run build        # Compilar TypeScript a dist/
npm run start        # Correr la build compilada (producción)
npx prisma studio    # Interfaz visual de la base de datos
npx prisma migrate dev --name <nombre>  # Nueva migración

# Frontend
npm start            # Dev server en localhost:4200
npm run build        # Build de producción (dist/frontend/browser)
```

---

## Variables de entorno

### `backend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/taskmanager` |
| `JWT_SECRET` | Clave para firmar tokens JWT (mín. 32 chars) | `mi_clave_secreta_super_larga_aqui` |
| `JWT_EXPIRES_IN` | Expiración del token | `8h` |
| `PORT` | Puerto del servidor (Railway lo inyecta automáticamente) | `3000` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:4200` |

---

## API — Resumen de endpoints

| Grupo | Base path | Auth requerida |
|---|---|---|
| Autenticación | `/api/auth` | Pública (login/register) |
| Tareas | `/api/tasks` | JWT |
| Departamentos | `/api/departments` | JWT |
| Dashboard | `/api/dashboard` | JWT + rol ADMIN |

Health check: `GET /health`

## Flujo de trabajo con Git


### Crear una rama y hacer PR

```bash
# 1. Asegurarse de estar actualizado
git checkout main
git pull origin main

# 2. Crear rama desde main
git checkout -b feature/nombre-de-la-feature

# 3. Hacer cambios, commits...
git add <archivos>
git commit -m "feat: descripción clara del cambio"

# 4. Subir la rama
git push origin feature/nombre-de-la-feature

# 5. Abrir un Pull Request en GitHub hacia main
```

### Convención de commits

```
feat:   nueva funcionalidad
fix:    corrección de bug
chore:  tarea técnica (config, deps, refactor sin cambio de lógica)
docs:   cambios en documentación
```

### Checklist antes de abrir un PR

- [ ] La rama está actualizada con `main` (`git pull origin main`)
- [ ] El código compila sin errores (`npx tsc --noEmit` en backend, `npm run build` en frontend)
- [ ] Las migraciones de Prisma están incluidas si se modificó el schema
- [ ] El `.env` no está incluido en el commit
- [ ] El título del PR describe claramente qué cambia

### CI automático

Al abrir o actualizar un PR, GitHub Actions ejecuta automáticamente:

- **Backend:** TypeScript check + `prisma generate`
- **Frontend:** `ng build` (producción)

El merge a `main` solo debería hacerse si el CI está en verde.

---

## Estructura del repositorio

```
proyecto-analisis/
├── frontend/                  # Angular 17
│   ├── src/app/
│   │   ├── core/              # Guards, interceptors, servicios globales
│   │   ├── features/          # Módulos por funcionalidad (auth, tasks, dashboard)
│   │   └── shared/            # Modelos TypeScript y componentes reutilizables
│   ├── railway.json
│   └── nixpacks.toml
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── controllers/       # Manejo de requests HTTP
│   │   ├── services/          # Lógica de negocio
│   │   ├── routes/            # Definición de rutas
│   │   ├── middleware/        # Auth JWT, roles, errores
│   │   └── utils/             # JWT helpers, bcrypt
│   ├── prisma/schema.prisma   # Modelos de base de datos
│   ├── railway.json
│   └── nixpacks.toml
└── .github/workflows/
    └── ci-cd.yml              # Pipeline de CI (TypeScript + Angular build)
```