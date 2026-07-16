import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-student@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const parentUser = {
  nombre: 'Pedro',
  apellido: 'Padre',
  email: 'pedro-padre@test.com',
  password: 'password123',
  fecha_nacimiento: '1980-01-01',
  rolNombre: 'parent',
  genero: 'Masculino',
  domicilio: 'Calle 1',
  nacionalidad: 'Venezolana',
  telefono: '+50312345678',
  telefono_trabajo: '+50312345679',
  lugar_trabajo: 'Oficina',
  profesion: 'Ingeniero',
};

const gradeSectionData = { grado: '1', seccion: 'A', materias: [] };

const buildStudent = (email) => ({
  nombre: 'Juan',
  apellido: 'Estudiante',
  email,
  password: 'password123',
  rolNombre: 'student',
  fecha_nacimiento: '2010-05-05',
  genero: 'Masculino',
  domicilio: 'Casa 1',
  nacionalidad: 'Venezolana',
  email_padre: parentUser.email,
  grado: gradeSectionData.grado,
  seccion: gradeSectionData.seccion,
  alergias: 'Ninguna',
  condiciones_medicas: 'Ninguna',
  contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
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
  await Role.create({ nombre: 'student' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await request.post('/api/users/register').send(adminUser);
  const adminCookie = await loginAsAdmin();

  await request.post('/api/parents').set('Cookie', adminCookie).send(parentUser);
  await request.post('/api/gradeSections/create').set('Cookie', adminCookie).send(gradeSectionData);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/students (admin)', () => {
  it('debe crear un estudiante - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/students')
      .set('Cookie', cookie)
      .send(buildStudent('est1@test.com'));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Estudiante creado con éxito');
    expect(res.body.data.email).toBe('est1@test.com');
    expect(res.body.data.id).toBeDefined();
  });

  it('debe fallar si el padre no existe - 404', async () => {
    const cookie = await loginAsAdmin();
    const payload = buildStudent('est2@test.com');
    payload.email_padre = 'noexiste-padre@test.com';

    const res = await request.post('/api/students').set('Cookie', cookie).send(payload);

    expect(res.status).toBe(404);
  });

  it('debe rechazar sin rol admin - 403', async () => {
    await request.post('/api/users/register').send({
      nombre: 'Otro', apellido: 'Usuario', email: 'no-admin@test.com', password: 'password123',
      rolNombre: 'student', fecha_nacimiento: '2000-01-01', genero: 'Masculino',
      domicilio: 'Casa', nacionalidad: 'Venezolana',
    });
    const loginRes = await request.post('/api/users/login').send({
      email: 'no-admin@test.com',
      password: 'password123',
    });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request
      .post('/api/students')
      .set('Cookie', cookie.split(';')[0])
      .send(buildStudent('est-noadmin@test.com'));

    expect(res.status).toBe(403);
  });
});

describe('GET /api/students (admin)', () => {
  it('debe listar estudiantes paginados - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/students').set('Cookie', cookie).send(buildStudent('est3@test.com'));

    const res = await request.get('/api/students').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });
});

describe('PUT /api/students (admin)', () => {
  it('debe actualizar un estudiante - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/students').set('Cookie', cookie).send(buildStudent('est4@test.com'));

    const res = await request
      .put('/api/students')
      .set('Cookie', cookie)
      .send({
        email: 'est4@test.com',
        grado: gradeSectionData.grado,
        seccion: gradeSectionData.seccion,
        alergias: 'Polen',
        condiciones_medicas: 'Ninguna',
        contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.alergias).toBe('Polen');
  });

  it('debe fallar si el estudiante no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/students')
      .set('Cookie', cookie)
      .send({
        email: 'noexiste-est@test.com',
        grado: gradeSectionData.grado,
        seccion: gradeSectionData.seccion,
        alergias: 'Polen',
        condiciones_medicas: 'Ninguna',
        contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/students (admin)', () => {
  it('debe eliminar un estudiante por email - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/students').set('Cookie', cookie).send(buildStudent('est5@test.com'));

    const res = await request
      .delete('/api/students')
      .set('Cookie', cookie)
      .send({ email: 'est5@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('est5@test.com');
  });

  it('debe fallar si el estudiante no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/students')
      .set('Cookie', cookie)
      .send({ email: 'noexiste-est2@test.com' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/students/id (admin)', () => {
  it('debe eliminar un estudiante por id - 200', async () => {
    const cookie = await loginAsAdmin();
    const createRes = await request
      .post('/api/students')
      .set('Cookie', cookie)
      .send(buildStudent('est6@test.com'));
    const studentId = createRes.body.data.id;

    const res = await request
      .delete('/api/students/id')
      .set('Cookie', cookie)
      .send({ id: studentId });

    expect(res.status).toBe(200);
  });

  it('debe fallar si el id no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/students/id')
      .set('Cookie', cookie)
      .send({ id: '507f1f77bcf86cd799439011' });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/students/get-all (autorización)', () => {
  it('un estudiante no puede pedir las notas de otro estudiante - 403', async () => {
    await request.post('/api/students').set('Cookie', await loginAsAdmin()).send(buildStudent('est7@test.com'));
    await request.post('/api/students').set('Cookie', await loginAsAdmin()).send(buildStudent('est8@test.com'));

    const loginRes = await request.post('/api/users/login').send({
      email: 'est7@test.com',
      password: 'password123',
    });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', cookie.split(';')[0])
      .send({ email: 'est8@test.com' });

    expect(res.status).toBe(403);
  });
});
