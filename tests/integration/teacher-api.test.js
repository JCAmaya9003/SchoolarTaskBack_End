import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-teacher@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const gradeSectionData = { grado: '2', seccion: 'B', materias: ['Matematicas'] };

const buildTeacher = (email) => ({
  nombre: 'Laura',
  apellido: 'Profesora',
  email,
  password: 'password123',
  rolNombre: 'teacher',
  fecha_nacimiento: '1985-03-10',
  genero: 'Femenino',
  domicilio: 'Casa 2',
  nacionalidad: 'Venezolana',
  asignaciones: [
    {
      materias: ['Matematicas'],
      grado_secciones: [{ grado: gradeSectionData.grado, seccion: gradeSectionData.seccion }],
    },
  ],
  telefono: '+50312345678',
  especialidad: 'Álgebra',
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
  await Role.create({ nombre: 'teacher' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
  const adminCookie = await loginAsAdmin();

  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Matematicas' });
  await request.post('/api/gradeSections').set('Cookie', adminCookie).send(gradeSectionData);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/teachers (admin)', () => {
  it('debe crear un profesor - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/teachers')
      .set('Cookie', cookie)
      .send(buildTeacher('prof1@test.com'));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Profesor creado con éxito');
    expect(res.body.data.email).toBe('prof1@test.com');
    expect(res.body.data.id).toBeDefined();
  });

  it('rechaza HTML/scripts en campos de texto libre (especialidad) - 400 (defensa XSS)', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/teachers')
      .set('Cookie', cookie)
      .send({ ...buildTeacher('prof-xss@test.com'), especialidad: '<script>alert(document.cookie)</script>' });

    expect(res.status).toBe(400);
  });

  it('debe fallar si la materia no existe - 404', async () => {
    const cookie = await loginAsAdmin();
    const payload = buildTeacher('prof2@test.com');
    payload.asignaciones[0].materias = ['MateriaFantasma'];

    const res = await request.post('/api/teachers').set('Cookie', cookie).send(payload);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/teachers (admin)', () => {
  it('debe listar profesores paginados - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof3@test.com'));

    const res = await request.get('/api/teachers').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });

  it('debe incluir genero/domicilio/nacionalidad/rol en el listado - 200 (regresión: findAllTeachers no los populaba)', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof-populate@test.com'));

    const res = await request.get('/api/teachers').set('Cookie', cookie);

    const teacher = res.body.data.items.find((t) => t.email === 'prof-populate@test.com');
    expect(teacher.genero).toBe('Femenino');
    expect(teacher.domicilio).toBe('Casa 2');
    expect(teacher.nacionalidad).toBe('Venezolana');
    expect(teacher.rol).toBeDefined();
  });
});

describe('POST /api/users/get-info (teacher)', () => {
  it('debe devolver grado_encargado con las materias del profesor - 200 (regresión: campos direccion/materias/grados_secciones inexistentes)', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof-getinfo@test.com'));

    const res = await request
      .post('/api/users/get-info')
      .set('Cookie', cookie)
      .send({ email: 'prof-getinfo@test.com', rolNombre: 'teacher' });

    expect(res.status).toBe(200);
    expect(res.body.data.direccion).toBeUndefined();
    expect(res.body.data.materias).toBeUndefined();
    expect(res.body.data.grados_secciones).toBeUndefined();
    expect(Array.isArray(res.body.data.grado_encargado)).toBe(true);
    expect(res.body.data.grado_encargado[0].materias.length).toBeGreaterThan(0);
  });
});

describe('PUT /api/teachers (admin)', () => {
  it('debe actualizar un profesor - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof4@test.com'));

    const res = await request
      .put('/api/teachers')
      .set('Cookie', cookie)
      .send({
        email: 'prof4@test.com',
        asignaciones: [
          {
            materias: ['Matematicas'],
            grado_secciones: [{ grado: gradeSectionData.grado, seccion: gradeSectionData.seccion }],
          },
        ],
        telefono: '+50387654321',
        especialidad: 'Geometría',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.especialidad).toBe('Geometría');
  });

  it('debe fallar si el profesor no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/teachers')
      .set('Cookie', cookie)
      .send({
        email: 'noexiste-prof@test.com',
        asignaciones: [
          {
            materias: ['Matematicas'],
            grado_secciones: [{ grado: gradeSectionData.grado, seccion: gradeSectionData.seccion }],
          },
        ],
        telefono: '+50387654321',
        especialidad: 'Geometría',
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/teachers (admin)', () => {
  it('debe eliminar un profesor por email - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof5@test.com'));

    const res = await request
      .delete('/api/teachers')
      .set('Cookie', cookie)
      .send({ email: 'prof5@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('prof5@test.com');
  });

  it('debe fallar si el profesor no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/teachers')
      .set('Cookie', cookie)
      .send({ email: 'noexiste-prof2@test.com' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/teachers/id (admin)', () => {
  it('debe eliminar un profesor por id - 200', async () => {
    const cookie = await loginAsAdmin();
    const createRes = await request
      .post('/api/teachers')
      .set('Cookie', cookie)
      .send(buildTeacher('prof6@test.com'));
    const teacherId = createRes.body.data.id;

    const res = await request
      .delete('/api/teachers/id')
      .set('Cookie', cookie)
      .send({ id: teacherId });

    expect(res.status).toBe(200);
  });

  it('debe fallar si el id no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/teachers/id')
      .set('Cookie', cookie)
      .send({ id: '507f1f77bcf86cd799439011' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/teachers/get-teacherInfo', () => {
  it('un profesor puede ver la info de sus propias materias - 200', async () => {
    await request.post('/api/teachers').set('Cookie', await loginAsAdmin()).send(buildTeacher('prof7@test.com'));

    const loginRes = await request.post('/api/users/login').send({
      email: 'prof7@test.com',
      password: 'password123',
    });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request.get('/api/teachers/get-teacherInfo').set('Cookie', cookie.split(';')[0]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe rechazar sin autenticación - 401', async () => {
    const res = await request.get('/api/teachers/get-teacherInfo');

    expect(res.status).toBe(401);
  });
});
