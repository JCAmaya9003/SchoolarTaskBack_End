import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-evalgrade@test.com',
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
  email: 'pedro-padre-evalgrade@test.com',
  password: 'password123',
  fecha_nacimiento: '1980-01-01',
  rolNombre: 'parent',
  genero: 'Masculino',
  domicilio: 'Calle 1',
  nacionalidad: 'Venezolana',
  telefono: '+50312345670',
  telefono_trabajo: '+50312345671',
  lugar_trabajo: 'Oficina',
  profesion: 'Ingeniero',
};

const gradeSectionData = { grado: '4', seccion: 'A', materias: ['Matematicas', 'Historia'] };

const studentEmail = 'estudiante-evalgrade@test.com';

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
  await Role.create({ nombre: 'parent' });
  await Role.create({ nombre: 'student' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
  const adminCookie = await loginAsAdmin();

  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Matematicas' });
  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Historia' });
  await request.post('/api/gradeSections').set('Cookie', adminCookie).send(gradeSectionData);

  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-mate-grade@test.com', 'Matematicas'));
  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-historia-grade@test.com', 'Historia'));

  await request.post('/api/parents').set('Cookie', adminCookie).send(parentUser);
  await request.post('/api/students').set('Cookie', adminCookie).send({
    nombre: 'Juan',
    apellido: 'Estudiante',
    email: studentEmail,
    password: 'password123',
    rolNombre: 'student',
    fecha_nacimiento: '2012-05-05',
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

  await request.post('/api/evaluations').set('Cookie', adminCookie).send({
    nombre: 'Parcial Mate', nombreMateria: 'Matematicas', descripcion: 'desc', fecha: '2026-08-01', peso: 0.3,
  });
  await request.post('/api/evaluations').set('Cookie', adminCookie).send({
    nombre: 'Parcial Historia', nombreMateria: 'Historia', descripcion: 'desc', fecha: '2026-08-01', peso: 0.3,
  });
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/evaluation_grades', () => {
  it('admin puede crear una calificación - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: 8 });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.calificacion).toBe(8);
    expect(res.body.data.estudiante.email).toBe(studentEmail);
  });

  it('rechaza una calificación fuera de rango 0-10 al crear - 400, antes el controller nunca llamaba validationResult', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: 15 });

    expect(res.status).toBe(400);
  });

  it('rechaza una calificación negativa - 400, antes el controller nunca llamaba validationResult', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: -5 });

    expect(res.status).toBe(400);
  });

  it('rechaza HTML/scripts en nombreMateria - 400, defensa XSS', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: '<script>alert(1)</script>', nombreEvaluacion: 'Parcial Mate', calificacion: 8 });

    expect(res.status).toBe(400);
  });

  it('falla si ya existe una nota para ese estudiante y evaluación - 409', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: 9 });

    expect(res.status).toBe(409);
  });

  it('falla si el estudiante no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: 'noexiste-evalgrade@test.com', nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: 8 });

    expect(res.status).toBe(404);
  });

  it('un teacher puede crear una calificación en su propia materia - 201', async () => {
    const cookie = await loginAs('prof-historia-grade@test.com', 'password123');

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Historia', nombreEvaluacion: 'Parcial Historia', calificacion: 7 });

    expect(res.status).toBe(201);
  });

  it('un teacher NO puede crear una calificación en materia ajena - 403', async () => {
    const cookie = await loginAs('prof-historia-grade@test.com', 'password123');

    const res = await request
      .post('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: 5 });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/evaluation_grades/all', () => {
  it('admin ve calificaciones de todas las materias paginadas - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.get('/api/evaluation_grades/all').set('Cookie', cookie).query({ limit: 50 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.totalItems).toBeGreaterThanOrEqual(2);
    const materias = res.body.data.items.map((item) => item.evaluacion.nombre);
    expect(materias).toContain('Parcial Mate');
    expect(materias).toContain('Parcial Historia');
  });

  it('un teacher solo ve calificaciones de sus propias materias - 200', async () => {
    const cookie = await loginAs('prof-mate-grade@test.com', 'password123');

    const res = await request.get('/api/evaluation_grades/all').set('Cookie', cookie).query({ limit: 50 });

    expect(res.status).toBe(200);
    const evaluaciones = res.body.data.items.map((item) => item.evaluacion.nombre);
    expect(evaluaciones).toContain('Parcial Mate');
    expect(evaluaciones).not.toContain('Parcial Historia');
  });
});

describe('GET /api/evaluation_grades/by-evaluation', () => {
  it('un teacher NO puede ver calificaciones de una evaluación ajena - 403', async () => {
    const cookie = await loginAs('prof-mate-grade@test.com', 'password123');

    const res = await request
      .get('/api/evaluation_grades/by-evaluation')
      .set('Cookie', cookie)
      .query({ nombre: 'Parcial Historia', nombreMateria: 'Historia' });

    expect(res.status).toBe(403);
  });

  it('un teacher puede ver calificaciones de su propia evaluación - 200', async () => {
    const cookie = await loginAs('prof-mate-grade@test.com', 'password123');

    const res = await request
      .get('/api/evaluation_grades/by-evaluation')
      .set('Cookie', cookie)
      .query({ nombre: 'Parcial Mate', nombreMateria: 'Matematicas' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('PUT /api/evaluation_grades', () => {
  it('admin puede editar una calificación - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.calificacion).toBe(10);
  });

  it('falla si la calificación no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Historia', nombreEvaluacion: 'No existe', calificacion: 5 });

    expect(res.status).toBe(404);
  });

  it('rechaza una calificación fuera de rango al editar - 400, antes el controller nunca llamaba validationResult', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Mate', calificacion: 20 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/evaluation_grades', () => {
  it('admin puede eliminar una calificación - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Historia', nombreEvaluacion: 'Parcial Historia' });

    expect(res.status).toBe(200);
  });

  it('falla si la calificación no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/evaluation_grades')
      .set('Cookie', cookie)
      .send({ email: studentEmail, nombreMateria: 'Historia', nombreEvaluacion: 'Parcial Historia' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/evaluations, cascada de notas', () => {
  it('borra sus notas en cascada y la vista de notas del alumno no se cae - 200', async () => {
    const cookie = await loginAsAdmin();

    // Nueva evaluación + nota para el estudiante
    await request.post('/api/evaluations').set('Cookie', cookie).send({
      nombre: 'Parcial Cascada', nombreMateria: 'Matematicas', descripcion: 'd', fecha: '2026-09-01', peso: 0.2,
    });
    await request.post('/api/evaluation_grades').set('Cookie', cookie).send({
      email: studentEmail, nombreMateria: 'Matematicas', nombreEvaluacion: 'Parcial Cascada', calificacion: 6,
    });

    // La nota existe antes de borrar la evaluación
    const before = await request.get('/api/evaluation_grades/by-student').set('Cookie', cookie).query({ email: studentEmail });
    expect(before.status).toBe(200);
    expect(before.body.data.some((g) => g.evaluacion.nombre === 'Parcial Cascada')).toBe(true);

    // El teacher/admin borra la evaluación
    const del = await request.delete('/api/evaluations').set('Cookie', cookie).send({ nombre: 'Parcial Cascada', nombreMateria: 'Matematicas' });
    expect(del.status).toBe(200);

    // La nota se fue en cascada y la vista no se cae (antes daba 500 por nota huérfana)
    const after = await request.get('/api/evaluation_grades/by-student').set('Cookie', cookie).query({ email: studentEmail });
    expect(after.status).toBe(200);
    expect(after.body.data.some((g) => g.evaluacion.nombre === 'Parcial Cascada')).toBe(false);

    // La vista agregada del alumno (get-all) también responde 200
    const gradesInfo = await request.post('/api/students/get-all').set('Cookie', cookie).send({ email: studentEmail });
    expect(gradesInfo.status).toBe(200);
  });
});
