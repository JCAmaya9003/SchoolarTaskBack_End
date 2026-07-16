import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-evaluation@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const gradeSectionData = { grado: '3', seccion: 'A', materias: ['Matematicas', 'Historia'] };

const buildTeacher = (email, materia) => ({
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
      materias: [materia],
      grado_secciones: [{ grado: gradeSectionData.grado, seccion: gradeSectionData.seccion }],
    },
  ],
  telefono: '+50312345678',
  especialidad: 'Docencia',
});

async function loginAs(email, password) {
  const res = await request.post('/api/users/login').send({ email, password });
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
}

async function loginAsAdmin() {
  return loginAs(adminUser.email, adminUser.password);
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
  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Historia' });
  await request.post('/api/gradeSections').set('Cookie', adminCookie).send(gradeSectionData);

  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-mate-eval@test.com', 'Matematicas'));
  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-historia-eval@test.com', 'Historia'));
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/evaluations', () => {
  it('admin puede crear una evaluación - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial 1', nombreMateria: 'Matematicas', descripcion: 'Primer parcial', fecha: '2026-08-01', peso: 0.3 });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.materia).toBe('Matematicas');
  });

  it('falla si la materia no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial X', nombreMateria: 'MateriaFantasma', descripcion: 'desc', fecha: '2026-08-01', peso: 0.3 });

    expect(res.status).toBe(404);
  });

  it('falla si la evaluación ya existe para esa materia - 409', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial 1', nombreMateria: 'Matematicas', descripcion: 'Duplicada', fecha: '2026-08-01', peso: 0.3 });

    expect(res.status).toBe(409);
  });

  it('un teacher puede crear una evaluación en su propia materia - 201', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Quiz 1', nombreMateria: 'Matematicas', descripcion: 'Quiz', fecha: '2026-08-05', peso: 0.1 });

    expect(res.status).toBe(201);
  });

  it('un teacher NO puede crear una evaluación en materia ajena - 403', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Quiz Historia', nombreMateria: 'Historia', descripcion: 'Quiz', fecha: '2026-08-05', peso: 0.1 });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/evaluations', () => {
  it('admin ve evaluaciones de todas las materias - 200', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial Historia 1', nombreMateria: 'Historia', descripcion: 'desc', fecha: '2026-08-02', peso: 0.3 });

    const res = await request.get('/api/evaluations').set('Cookie', cookie).query({ limit: 50 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    const materias = res.body.data.items.map((item) => item.materia);
    expect(materias).toContain('Matematicas');
    expect(materias).toContain('Historia');
  });

  it('un teacher solo ve evaluaciones de sus propias materias - 200', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request.get('/api/evaluations').set('Cookie', cookie).query({ limit: 50 });

    expect(res.status).toBe(200);
    const materias = res.body.data.items.map((item) => item.materia);
    expect(materias.every((materia) => materia === 'Matematicas')).toBe(true);
    expect(materias).not.toContain('Historia');
  });
});

describe('PUT /api/evaluations', () => {
  it('admin puede editar una evaluación - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/evaluations')
      .set('Cookie', cookie)
      .send({
        nombre: 'Parcial 1',
        nuevoNombre: 'Parcial 1 (editado)',
        nombreMateria: 'Matematicas',
        nuevaMateria: 'Matematicas',
        descripcion: 'Editada',
        fecha: '2026-08-03',
        peso: 0.35,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Parcial 1 (editado)');
  });

  it('falla si la evaluación no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/evaluations')
      .set('Cookie', cookie)
      .send({
        nombre: 'No existe',
        nuevoNombre: 'Nuevo',
        nombreMateria: 'Matematicas',
        nuevaMateria: 'Matematicas',
        descripcion: 'desc',
        fecha: '2026-08-03',
        peso: 0.2,
      });

    expect(res.status).toBe(404);
  });

  it('un teacher NO puede editar una evaluación de materia ajena - 403', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .put('/api/evaluations')
      .set('Cookie', cookie)
      .send({
        nombre: 'Parcial Historia 1',
        nuevoNombre: 'Hackeado',
        nombreMateria: 'Historia',
        nuevaMateria: 'Historia',
        descripcion: 'desc',
        fecha: '2026-08-03',
        peso: 0.2,
      });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/evaluations', () => {
  it('admin puede eliminar una evaluación - 200', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'A eliminar', nombreMateria: 'Matematicas', descripcion: 'desc', fecha: '2026-08-06', peso: 0.1 });

    const res = await request
      .delete('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'A eliminar', nombreMateria: 'Matematicas' });

    expect(res.status).toBe(200);
  });

  it('un teacher NO puede eliminar una evaluación de materia ajena - 403', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .delete('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial Historia 1', nombreMateria: 'Historia' });

    expect(res.status).toBe(403);
  });

  it('falla si la evaluación no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'No existe', nombreMateria: 'Matematicas' });

    expect(res.status).toBe(404);
  });
});
