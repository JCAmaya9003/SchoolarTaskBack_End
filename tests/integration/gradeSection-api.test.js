import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-gradesection@test.com',
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
  const adminCookie = await loginAsAdmin();

  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Geografia' });
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/gradeSections (admin)', () => {
  it('debe crear un grado y sección - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '5', seccion: 'A', materias: ['Geografia'] });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.grado).toBe('5');
    expect(res.body.data.materias[0].nombre).toBe('Geografia');
  });

  it('debe fallar si el grado y sección ya existe - 409', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '5', seccion: 'A', materias: [] });

    expect(res.status).toBe(409);
  });

  it('debe fallar si una materia no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '5', seccion: 'B', materias: ['MateriaFantasma'] });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/gradeSections', () => {
  it('debe listar los grados y secciones - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.get('/api/gradeSections').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((gs) => gs.grado === '5' && gs.seccion === 'A')).toBe(true);
  });
});

describe('PUT /api/gradeSections (admin)', () => {
  it('debe actualizar un grado y sección - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '5', seccion: 'A', nuevoGrado: '5', nuevaSeccion: 'C', materias: ['Geografia'] });

    expect(res.status).toBe(200);
    expect(res.body.data.seccion).toBe('C');
  });

  it('debe fallar si el grado y sección no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '9', seccion: 'Z', nuevoGrado: '9', nuevaSeccion: 'Z', materias: [] });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/gradeSections/add-subjects y /remove-subjects (admin)', () => {
  it('debe agregar materias a un grado y sección - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'Arte' });

    const res = await request
      .post('/api/gradeSections/add-subjects')
      .set('Cookie', cookie)
      .send({ grado: '5', seccion: 'C', materias: ['Arte'] });

    expect(res.status).toBe(200);
    expect(res.body.data.materias.some((m) => m.nombre === 'Arte')).toBe(true);
  });

  it('debe eliminar materias de un grado y sección - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/gradeSections/remove-subjects')
      .set('Cookie', cookie)
      .send({ grado: '5', seccion: 'C', materias: ['Arte'] });

    expect(res.status).toBe(200);
    expect(res.body.data.materias.some((m) => m.nombre === 'Arte')).toBe(false);
  });
});

describe('DELETE /api/gradeSections (admin)', () => {
  it('debe eliminar un grado y sección - 200', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '6', seccion: 'A', materias: [] });

    const res = await request
      .delete('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '6', seccion: 'A' });

    expect(res.status).toBe(200);
  });

  it('debe fallar si el grado y sección no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '9', seccion: 'Z' });

    expect(res.status).toBe(404);
  });

  it('debe devolver las materias populadas al eliminar un grado y sección que sí tiene materias asignadas - 200 (regresión: deleteGradeAndSectionById no populaba materias)', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '6', seccion: 'B', materias: ['Geografia'] });

    const res = await request
      .delete('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '6', seccion: 'B' });

    expect(res.status).toBe(200);
    expect(res.body.data.materias[0].nombre).toBe('Geografia');
    expect(res.body.data.materias[0].id).toBeDefined();
  });
});
