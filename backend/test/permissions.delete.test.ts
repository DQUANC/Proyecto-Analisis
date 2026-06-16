/**
 * Tests de permisos para borrado de usuarios y tareas.
 *
 * Verifica que SOLO un usuario con isSuperUser === true pueda eliminar
 * usuarios o tareas. Un ADMIN normal (isSuperUser: false) debe recibir 403.
 *
 * No requiere base de datos: los services se mockean a nivel de módulo
 * antes de importar los controllers, así que se ejercita exclusivamente
 * la lógica de autorización de los controllers.
 *
 * Ejecutar con:
 *   npx ts-node -e "require('node:test/reporters')" // (no usado)
 *   node --import ts-node/esm --test test/permissions.delete.test.ts   (ESM)
 * o simplemente:
 *   npx ts-node ./node_modules/.bin/.. (ver package.json script "test")
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';

// ── Mock manual de los services para no tocar Prisma/DB ──────────────────────
const originalLoad = (Module as any)._load;
const removeCalls: { users: number[]; tasks: number[] } = { users: [], tasks: [] };

(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request.endsWith('services/users.service')) {
    return {
      remove: async (id: number) => { removeCalls.users.push(id); },
      getById: async (_id: number) => ({ id: _id, role: 'WORKER', isSuperUser: false }),
    };
  }
  if (request.endsWith('services/tasks.service')) {
    return {
      deleteTask: async (id: number) => { removeCalls.tasks.push(id); },
    };
  }
  return originalLoad.apply(this, arguments as any);
};

// Importar los controllers DESPUES de instalar el mock, para que sus
// `require('../services/...')` resuelvan a los mocks de arriba.
const usersController = require(path.join(__dirname, '..', 'src', 'controllers', 'users.controller'));
const tasksController = require(path.join(__dirname, '..', 'src', 'controllers', 'tasks.controller'));

// Restaurar el loader original inmediatamente después de importar.
(Module as any)._load = originalLoad;

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: any) { this.body = payload; return this; },
    send(payload?: any) { this.body = payload; return this; },
  };
  return res;
}

function makeReq(user: any, params: Record<string, string> = {}) {
  return { user, params } as any;
}

function makeNext() {
  const calls: any[] = [];
  const next = (err?: any) => calls.push(err);
  (next as any).calls = calls;
  return next;
}

// ── Eliminar USUARIOS ─────────────────────────────────────────────────────

test('ADMIN normal (isSuperUser=false) NO puede eliminar usuarios -> 403', async () => {
  removeCalls.users.length = 0;
  const req = makeReq({ id: 1, role: 'ADMIN', isSuperUser: false }, { id: '99' });
  const res = makeRes();
  const next = makeNext();

  await usersController.remove(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Super Usuario/);
  assert.deepEqual(removeCalls.users, [], 'el service de borrado no debe haberse invocado');
});

test('SUPER USUARIO (isSuperUser=true) SI puede eliminar usuarios -> 204', async () => {
  removeCalls.users.length = 0;
  const req = makeReq({ id: 1, role: 'ADMIN', isSuperUser: true }, { id: '99' });
  const res = makeRes();
  const next = makeNext();

  await usersController.remove(req, res, next);

  assert.equal(res.statusCode, 204);
  assert.deepEqual(removeCalls.users, [99]);
});

test('Super usuario no puede eliminar su propia cuenta -> 403', async () => {
  removeCalls.users.length = 0;
  const req = makeReq({ id: 5, role: 'ADMIN', isSuperUser: true }, { id: '5' });
  const res = makeRes();
  const next = makeNext();

  await usersController.remove(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(removeCalls.users, []);
});

// ── Eliminar TAREAS ───────────────────────────────────────────────────────

test('ADMIN normal (isSuperUser=false) NO puede eliminar tareas -> 403', async () => {
  removeCalls.tasks.length = 0;
  const req = makeReq({ id: 1, role: 'ADMIN', isSuperUser: false }, { id: '42' });
  const res = makeRes();
  const next = makeNext();

  await tasksController.remove(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Super Usuario/);
  assert.deepEqual(removeCalls.tasks, []);
});

test('SUPER USUARIO (isSuperUser=true) SI puede eliminar tareas -> 204', async () => {
  removeCalls.tasks.length = 0;
  const req = makeReq({ id: 1, role: 'ADMIN', isSuperUser: true }, { id: '42' });
  const res = makeRes();
  const next = makeNext();

  await tasksController.remove(req, res, next);

  assert.equal(res.statusCode, 204);
  assert.deepEqual(removeCalls.tasks, [42]);
});

test('WORKER nunca llega al controller de borrado (lo bloquea requireRole en la ruta), pero si llegara, isSuperUser=false lo bloquea igual -> 403', async () => {
  removeCalls.tasks.length = 0;
  const req = makeReq({ id: 7, role: 'WORKER', isSuperUser: false }, { id: '42' });
  const res = makeRes();
  const next = makeNext();

  await tasksController.remove(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(removeCalls.tasks, []);
});
