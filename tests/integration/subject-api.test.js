import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-subject@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

async function loginAsAdmin() {
  const res = await request.post('/api/users/login').send({
    email: adminUser.email,
    password: adminUser.password,
  });
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
}

beforeAll(async () => {
  await setupTestDB();
  await Role.create({ nombre: 'admin' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/subjects (admin)', () => {
  it('debe crear una materia - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'Fisica' });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.nombre).toBe('Fisica');
  });

  it('debe fallar si la materia ya existe - 409', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'Fisica' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/subjects', () => {
  it('debe listar las materias - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.get('/api/subjects').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((s) => s.nombre === 'Fisica')).toBe(true);
  });
});

describe('PUT /api/subjects (admin)', () => {
  it('debe editar una materia - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/subjects')
      .set('Cookie', cookie)
      .send({ nombre: 'Fisica', nuevoNombre: 'Fisica II' });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Fisica II');
  });

  it('debe fallar si la materia no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/subjects')
      .set('Cookie', cookie)
      .send({ nombre: 'NoExiste', nuevoNombre: 'Otra' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/subjects (admin)', () => {
  it('debe eliminar una materia - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'Quimica' });

    const res = await request.delete('/api/subjects').set('Cookie', cookie).send({ nombre: 'Quimica' });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Quimica');
  });

  it('debe fallar si la materia no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.delete('/api/subjects').set('Cookie', cookie).send({ nombre: 'NoExiste' });

    expect(res.status).toBe(404);
  });
});
