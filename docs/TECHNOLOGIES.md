# Tecnologías del Proyecto

## Resumen

| Capa | Tecnología | Versión declarada | Rol |
|------|-----------|------------------|-----|
| Frontend | Angular + Angular Material | 17+ | SPA framework + componentes de UI |
| Backend | Node.js | 20 LTS | Runtime de JavaScript en el servidor |
| Backend | Express | 4.x (`^4.18.2`) | Framework HTTP minimalista |
| ORM | Prisma | 5.x (`^5.0.0`) | Acceso type-safe a la base de datos |
| Base de datos | PostgreSQL | 15+ | Motor relacional |
| Autenticación | jsonwebtoken | 9.x (`^9.0.0`) | Firma y verificación de JWT |
| Hash de contraseñas | bcryptjs | 2.x (`^2.4.3`) | Hashing seguro de passwords |
| Lenguaje compartido | TypeScript | 5.x (`^5.0.0`) | Tipado estático en ambas capas |
| Variables de entorno | dotenv | 16.x (`^16.0.3`) | Carga de `.env` en desarrollo local |
| Dev server | nodemon + ts-node | 3.x / 10.x | Recarga automática durante desarrollo |

---

## 1. Monorepo con TypeScript end-to-end

El proyecto vive en un único repositorio con dos workspaces independientes:

```
proyecto/
├── frontend/   # Angular 17 SPA
└── backend/    # Node.js + Express REST API
```

Ambos workspaces usan TypeScript con `"strict": true`. Esto garantiza:
- Detección de errores de tipos en tiempo de compilación, antes de llegar a producción.
- Disciplina de tipos compartida: si el backend cambia la forma de un objeto, el frontend lo detecta al compilar.
- Un único pipeline de CI/CD que puede validar ambas capas en el mismo run.

> Los tipos compartidos (interfaces `Task`, `User`, etc.) viven por ahora en `frontend/src/app/shared/models/`. En una iteración futura se pueden extraer a un paquete `shared/` en la raíz del monorepo.

---

## 2. Frontend — Angular 17+

### ¿Por qué Angular y no React o Vue?

Angular es un framework opinado que incluye de fábrica:
- **Router** con lazy loading y guards
- **HttpClient** con interceptores
- **Formularios reactivos** con validación integrada
- **Inyección de dependencias** jerárquica

React y Vue son bibliotecas: hay que ensamblar esas piezas por separado (React Router, Axios, Zustand, etc.), lo que multiplica las decisiones de arquitectura para un equipo universitario pequeño. Angular impone una estructura clara desde el primer commit, reduciendo la divergencia entre lo que desarrolla cada integrante.

### Angular Material

`@angular/material` y `@angular/cdk` son las dependencias de UI:
- Componentes accesibles (WAI-ARIA) listos para usar: inputs, tablas, diálogos, snackbars.
- Theming basado en CSS Variables (Material Design 3), configurado globalmente en `src/styles.scss`.
- Integración nativa: no hay conflictos con el ciclo de detección de cambios de Angular.

### Componentes standalone (Angular 17)

Angular 17 adopta **standalone components** como patrón por defecto — se eliminan los `NgModule` superfluos:
- `AppComponent` declara `standalone: true`.
- Bootstrap via `bootstrapApplication(AppComponent, appConfig)` en `src/main.ts`.
- `provideRouter(routes)` y `provideHttpClient(withInterceptorsFromDi())` se registran en `src/app/app.config.ts`.
- No existe ningún `AppModule`.

### Builder de Angular 17

`angular.json` usa el builder actual basado en esbuild:

```
"builder": "@angular-devkit/build-angular:application"
```

Este builder es significativamente más rápido que el anterior (`browser`) y es el default en nuevos proyectos Angular 17+.

---

## 3. Backend — Node.js + Express

### ¿Por qué Node.js?

- El equipo ya maneja TypeScript en el frontend; reutilizar el mismo lenguaje en el backend elimina el cambio de contexto.
- Node.js es ideal para APIs REST de tipo I/O-bound (consultas a base de datos, red), que es exactamente el perfil de un Task Manager.
- Ecosistema npm: cualquier librería que se necesite ya existe.

### ¿Por qué Express?

Express es el framework HTTP más maduro de Node.js. Es minimalista: sólo agrega routing y middleware sobre el servidor nativo. Esto encaja con la arquitectura por capas elegida (routes → controllers → services → ORM), porque cada capa queda bajo nuestro control sin que el framework interfiera.

Alternativas evaluadas:
- **NestJS**: más estructurado y opinionado (decoradores, módulos), pero con curva de aprendizaje alta para un proyecto universitario de alcance acotado.
- **Fastify**: excelente rendimiento, pero menor cantidad de recursos educativos disponibles.

### Estructura de capas del backend

```
backend/src/
├── index.ts          ← Punto de entrada: carga dotenv y llama a app.listen()
├── app.ts            ← Configura Express: registra middleware y rutas; exporta app
├── routes/           ← Definición de endpoints HTTP
├── controllers/      ← Parsea request, llama a service, forma response
├── services/         ← Lógica de negocio pura (sin HTTP)
├── middleware/       ← auth (JWT), errores centralizados
└── utils/            ← Helpers reutilizables
```

### Separación index.ts / app.ts

`index.ts` es el punto de entrada real del proceso:

```typescript
import 'dotenv/config';  // debe ejecutarse ANTES de cualquier otro import
import './app';          // app.ts carga rutas y llama a app.listen()
```

Esta separación es necesaria porque TypeScript compila los `import` como `require()` síncronos al inicio del módulo. Si `dotenv.config()` estuviera en `app.ts` junto a los imports de rutas y middleware, el validador de `JWT_SECRET` (que corre al cargar el módulo) leería `process.env.JWT_SECRET` como `undefined` antes de que dotenv tuviese tiempo de ejecutarse.

### Middleware de seguridad registrado

| Middleware | Paquete | Rol |
|-----------|---------|-----|
| CORS | `cors ^2.8.5` | Controla orígenes permitidos; en prod usa `FRONTEND_URL` |
| JSON body parser | `express` (built-in) | Parsea `application/json` |
| Auth JWT | `auth.middleware.ts` | Protege todas las rutas de `/api/tasks` |
| Error centralizado | `error.middleware.ts` | Captura errores y estandariza respuesta `{ message }` |

### Herramientas de desarrollo

- **nodemon** (`^3.0.0`): reinicia el proceso cuando cambia algún archivo `.ts`.
- **ts-node** (`^10.9.1`): ejecuta TypeScript directamente sin compilar a JS primero; usado por nodemon.
- **dotenv** (`^16.0.3`): carga el archivo `.env` en `process.env` durante el desarrollo local.

---

## 4. ORM — Prisma

### ¿Por qué Prisma y no TypeORM, Sequelize o SQL crudo?

| Criterio | Prisma | TypeORM | Sequelize | SQL crudo |
|----------|--------|---------|-----------|-----------|
| Type safety | Generado automáticamente | Decoradores manuales | Manual | Ninguna |
| Migraciones | Automáticas + versionadas | Manual / CLI | Manual | Manual |
| Intellisense | Excelente | Buena | Regular | Ninguna |
| Curva de aprendizaje | Baja | Media | Media | Alta |

Prisma genera un cliente TypeScript a partir de `prisma/schema.prisma`. Cualquier consulta mal tipada falla en compilación, no en runtime. Las migraciones (`prisma migrate dev`) crean archivos SQL versionados que el equipo puede revisar en código.

### Configuración

- Schema: `backend/prisma/schema.prisma`
- Provider: `postgresql`
- `postinstall: prisma generate` — el cliente se regenera automáticamente después de cada `npm install`, evitando que un clon fresco del repo falle por cliente desactualizado.

---

## 5. Base de datos — PostgreSQL

### ¿Por qué PostgreSQL y no MySQL o SQLite?

- Motor relacional open-source más robusto y feature-complete.
- Soporte nativo en Railway (plataforma de despliegue), Supabase y Neon — todas con tier gratuito apto para proyectos universitarios.
- El modelo de datos (Usuario → Tareas) es claramente relacional; una base documental (MongoDB) añadiría complejidad innecesaria.
- SQLite no es apropiado para despliegue en contenedores porque el archivo de BD no persiste entre reinicios sin un volumen persistente.

### Despliegue

La variable `DATABASE_URL` es el único punto de conexión. En local, se define en `backend/.env` (gitignoreado). En Railway, se inyecta como variable de entorno del servicio.

---

## 6. Autenticación — JWT + bcryptjs

### ¿Por qué JWT y no sesiones?

- Frontend y backend son aplicaciones separadas, potencialmente en dominios distintos. Las cookies de sesión complican el manejo de CORS.
- JWT es **stateless**: el servidor no guarda estado de sesión; sólo verifica la firma. Esto simplifica el escalado.
- El token viaja en el header `Authorization: Bearer <token>`, fácil de implementar tanto en el interceptor de Angular como en el middleware de Express.

### Configuración de seguridad

| Parámetro | Valor | Dónde |
|-----------|-------|-------|
| Librería JWT | `jsonwebtoken ^9.0.0` | `auth.service.ts` |
| Expiración | `24h` | `jwt.sign(..., { expiresIn: '24h' })` |
| Hash de password | `bcryptjs ^2.4.3` | `auth.service.ts` |
| Cost factor | `10` | `bcrypt.hash(password, 10)` |
| Secreto | `process.env.JWT_SECRET` | `.env` local / Railway secrets |

### Patrón fail-fast para JWT_SECRET

Tanto `auth.middleware.ts` como `auth.service.ts` leen `JWT_SECRET` a nivel de módulo mediante un IIFE que lanza inmediatamente si la variable no está definida:

```typescript
const JWT_SECRET: string = (() => {
  const v = process.env.JWT_SECRET;
  if (!v) throw new Error('JWT_SECRET environment variable is required');
  return v;
})();
```

Esto garantiza que el servidor **no arranque** si `JWT_SECRET` no está configurado. No existe ningún valor de fallback — si la variable falta, el proceso muere con un error descriptivo antes de aceptar cualquier petición.

> Este patrón usa un IIFE en lugar de una simple asignación + `if` porque TypeScript no propaga el narrowing de tipos de variables de módulo hacia el interior de métodos de clase asíncronos. El IIFE fuerza a TypeScript a inferir el tipo de `JWT_SECRET` como `string` (no `string | undefined`).

---

## 7. Alternativas evaluadas

| Decisión | Opciones consideradas | Elegida | Razón principal |
|----------|----------------------|---------|----------------|
| Frontend framework | React, Vue | Angular | DI nativa, router, HTTP client — todo incluido; estructura predecible para el equipo |
| UI library | Tailwind, Bootstrap | Angular Material | Integración nativa; no requiere adaptadores |
| Backend framework | NestJS, Fastify | Express | Curva de aprendizaje más baja; control total de la arquitectura |
| ORM | TypeORM, Sequelize, SQL crudo | Prisma | Schema-first; type-safety automática; migraciones versionadas |
| Base de datos | MySQL, MongoDB, SQLite | PostgreSQL | ACID; soporte gratuito en Railway/Supabase; encaja con modelo relacional |
| Autenticación | Sesiones, Passport.js | JWT | Stateless; agnóstico al dominio; fácil de implementar en SPA |
