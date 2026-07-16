import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-place@test.com',
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

describe('POST /api/academic_places (admin)', () => {
  it('debe crear un lugar - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.post('/api/academic_places').set('Cookie', cookie).send({ lugar: 'Cancha' });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.lugar).toBe('Cancha');
  });

  it('debe fallar si el lugar ya existe - 409', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.post('/api/academic_places').set('Cookie', cookie).send({ lugar: 'Cancha' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/academic_places', () => {
  it('debe listar los lugares - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.get('/api/academic_places').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((p) => p.lugar === 'Cancha')).toBe(true);
  });
});

describe('PUT /api/academic_places (admin)', () => {
  it('debe editar un lugar - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/academic_places')
      .set('Cookie', cookie)
      .send({ lugar: 'Cancha', nuevoLugar: 'Cancha techada' });

    expect(res.status).toBe(200);
    expect(res.body.data.lugar).toBe('Cancha techada');
  });

  it('debe fallar si el lugar no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/academic_places')
      .set('Cookie', cookie)
      .send({ lugar: 'NoExiste', nuevoLugar: 'Otro' });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/academic_places/get-name', () => {
  it('debe obtener el nombre del lugar por id - 200', async () => {
    const cookie = await loginAsAdmin();
    const createRes = await request.post('/api/academic_places').set('Cookie', cookie).send({ lugar: 'Piscina' });
    const placeId = createRes.body.data.id;

    const res = await request.post('/api/academic_places/get-name').set('Cookie', cookie).send({ id: placeId });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Piscina');
  });

  it('debe fallar si el id no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/academic_places/get-name')
      .set('Cookie', cookie)
      .send({ id: '507f1f77bcf86cd799439011' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/academic_places (admin)', () => {
  it('debe eliminar un lugar - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/academic_places').set('Cookie', cookie).send({ lugar: 'Sala de música' });

    const res = await request
      .delete('/api/academic_places')
      .set('Cookie', cookie)
      .send({ lugar: 'Sala de música' });

    expect(res.status).toBe(200);
    expect(res.body.data.lugar).toBe('Sala de música');
  });

  it('debe fallar si el lugar no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.delete('/api/academic_places').set('Cookie', cookie).send({ lugar: 'NoExiste' });

    expect(res.status).toBe(404);
  });
});
