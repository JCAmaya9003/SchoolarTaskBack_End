import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-parent@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

let phoneCounter = 0;
const nextPhone = () => `+5031000${(phoneCounter++).toString().padStart(4, '0')}`;

const buildParent = (email) => ({
  nombre: 'Pedro',
  apellido: 'Padre',
  email,
  password: 'password123',
  rolNombre: 'parent',
  fecha_nacimiento: '1980-01-01',
  genero: 'Masculino',
  domicilio: 'Calle 1',
  nacionalidad: 'Venezolana',
  telefono: nextPhone(),
  telefono_trabajo: nextPhone(),
  lugar_trabajo: 'Oficina',
  profesion: 'Ingeniero',
});

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
  await Role.create({ nombre: 'parent' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/parents (admin)', () => {
  it('debe crear un padre - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/parents')
      .set('Cookie', cookie)
      .send(buildParent('padre1@test.com'));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Padre creado con éxito');
    expect(res.body.data.email).toBe('padre1@test.com');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.domicilio).toBe('Calle 1');
  });

  it('rechaza HTML/scripts en campos de texto libre (lugar_trabajo) - 400 (defensa XSS)', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/parents')
      .set('Cookie', cookie)
      .send({ ...buildParent('padre-xss@test.com'), lugar_trabajo: '<script>alert(document.cookie)</script>' });

    expect(res.status).toBe(400);
  });

  it('debe fallar si el usuario ya existe - 409', async () => {
    const cookie = await loginAsAdmin();
    const payload = buildParent('padre1@test.com'); // ya creado en el test anterior

    const res = await request.post('/api/parents').set('Cookie', cookie).send(payload);

    expect(res.status).toBe(409);
  });
});

describe('GET /api/parents (admin)', () => {
  it('debe listar padres paginados - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/parents').set('Cookie', cookie).send(buildParent('padre3@test.com'));

    const res = await request.get('/api/parents').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });
});

describe('PUT /api/parents (admin)', () => {
  it('debe actualizar un padre - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/parents').set('Cookie', cookie).send(buildParent('padre4@test.com'));

    const res = await request
      .put('/api/parents')
      .set('Cookie', cookie)
      .send({
        email: 'padre4@test.com',
        telefono: nextPhone(),
        telefono_trabajo: nextPhone(),
        lugar_trabajo: 'Otra Oficina',
        profesion: 'Ingeniero',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.lugar_trabajo).toBe('Otra Oficina');
  });

  it('debe fallar si el padre no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/parents')
      .set('Cookie', cookie)
      .send({
        email: 'noexiste-padre@test.com',
        telefono: nextPhone(),
        telefono_trabajo: nextPhone(),
        lugar_trabajo: 'Otra Oficina',
        profesion: 'Ingeniero',
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/parents (admin)', () => {
  it('debe eliminar un padre por email - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/parents').set('Cookie', cookie).send(buildParent('padre5@test.com'));

    const res = await request
      .delete('/api/parents')
      .set('Cookie', cookie)
      .send({ email: 'padre5@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('padre5@test.com');
  });

  it('debe fallar si el padre no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/parents')
      .set('Cookie', cookie)
      .send({ email: 'noexiste-padre2@test.com' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/parents/id (admin)', () => {
  it('debe eliminar un padre por id - 200', async () => {
    const cookie = await loginAsAdmin();
    const createRes = await request
      .post('/api/parents')
      .set('Cookie', cookie)
      .send(buildParent('padre6@test.com'));
    const parentId = createRes.body.data.id;

    const res = await request
      .delete('/api/parents/id')
      .set('Cookie', cookie)
      .send({ id: parentId });

    expect(res.status).toBe(200);
  });

  it('debe fallar si el id no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/parents/id')
      .set('Cookie', cookie)
      .send({ id: '507f1f77bcf86cd799439011' });

    expect(res.status).toBe(404);
  });
});
