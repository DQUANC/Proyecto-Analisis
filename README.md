# Task Manager

Aplicación de gestión de tareas — monorepo con Angular 17 (frontend) y Node.js + Express + Prisma (backend).

## Requisitos previos

- Node.js 20+
- npm 9+

## Configuración local

1. **Backend — dependencias y entorno**
   ```bash
   cd backend && npm install
   cp .env.example .env
   # Editar .env con tus credenciales de base de datos
   ```

2. **Backend — migraciones e inicio**
   ```bash
   npm run prisma:migrate
   npm run dev
   # API disponible en http://localhost:3000
   ```

3. **Frontend — dependencias e inicio**
   ```bash
   cd ../frontend && npm install
   npm start
   # App disponible en http://localhost:4200
   ```

## Documentación

- [Tecnologías](docs/TECHNOLOGIES.md)
- [Arquitectura y contrato de API](docs/ARCHITECTURE.md)
- [Tickets y tareas](docs/TICKETS.md)
