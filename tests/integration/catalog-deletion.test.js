import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, clearTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';
import Teacher from '../../src/models/teacher-model.js';
import GradeSection from '../../src/models/gradeSection-model.js';
import Evaluation from '../../src/models/evaluation-model.js';
import EvaluationGrade from '../../src/models/evaluation_grade.model.js';

let app;
let request;
let cookie;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Root',
  email: 'admin-catalog@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const g = (url) => request.get(url).set('Cookie', cookie);
const p = (url, body) => request.post(url).set('Cookie', cookie).send(body);
const d = (url, body) => request.delete(url).set('Cookie', cookie).send(body);

// Escenario base: materia Matematicas dictada en 5A, con un profesor asignado, una evaluación
// y una nota. Historia queda creada pero sin usar, para el caso "borrar algo que no está en uso".
async function seedEscenario({ conEstudiante = true } = {}) {
  await p('/api/subjects', { nombre: 'Matematicas' });
  await p('/api/subjects', { nombre: 'Historia' });
  await p('/api/gradeSections', { grado: '5', seccion: 'A', materias: ['Matematicas'] });
  await p('/api/parents', {
    nombre: 'Pedro', apellido: 'Perez', fecha_nacimiento: '1980-03-03', email: 'padre-cat@test.com',
    password: 'password123', rolNombre: 'parent', genero: 'Masculino', domicilio: 'Calle 2',
    nacionalidad: 'Venezolana', telefono: '+50312345678', telefono_trabajo: '+50387654321',
    lugar_trabajo: 'Oficina', profesion: 'Ingeniero',
  });
  await p('/api/teachers', {
    nombre: 'Luis', apellido: 'Gomez', email: 'profe-cat@test.com', password: 'password123',
    fecha_nacimiento: '1985-07-07', rolNombre: 'teacher', genero: 'Masculino', domicilio: 'Calle 4',
    nacionalidad: 'Venezolana', asignaciones: [{ materias: ['Matematicas'], grado: '5', seccion: 'A' }],
    telefono: '+50311112222', especialidad: 'Matematicas',
  });
  await p('/api/evaluations', {
    nombre: 'Parcial 1', nombreMateria: 'Matematicas', grado: '5', seccion: 'A',
    descripcion: 'Primer parcial', fecha: '2026-03-01', peso: 25,
  });

  if (conEstudiante) {
    await p('/api/students', {
      nombre: 'Ana', apellido: 'Perez', fecha_nacimiento: '2010-05-05', email: 'alumno-cat@test.com',
      password: 'password123', rolNombre: 'student', genero: 'Femenino', domicilio: 'Calle 3',
      nacionalidad: 'Venezolana', email_padre: 'padre-cat@test.com', grado: '5', seccion: 'A',
      alergias: 'Ninguna', condiciones_medicas: 'Ninguna',
      contacto_emergencia: { nombre: 'Pedro Perez', telefono: '+50312345678' },
    });
    await p('/api/evaluation_grades', {
      email: 'alumno-cat@test.com', nombreMateria: 'Matematicas',
      nombreEvaluacion: 'Parcial 1', calificacion: 8.5,
    });
  }
}

beforeAll(async () => {
  await setupTestDB();
  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  for (const nombre of ['admin', 'teacher', 'student', 'parent']) {
    await Role.create({ nombre });
  }
  await registerUserDirectly(adminUser);
  const res = await request.post('/api/users/login').send({
    email: adminUser.email,
    password: adminUser.password,
  });
  cookie = res.headers['set-cookie'][0].split(';')[0];
});

describe('DELETE /api/subjects, borrado en dos pasos', () => {
  it('una materia que no está en uso se borra directo - 200', async () => {
    await seedEscenario();

    const res = await d('/api/subjects', { nombre: 'Historia' });

    expect(res.status).toBe(200);
  });

  it('una materia en uso no se borra sin confirmar, e informa el impacto - 409', async () => {
    await seedEscenario();

    const res = await d('/api/subjects', { nombre: 'Matematicas' });

    expect(res.status).toBe(409);
    expect(res.body.impacto).toEqual({
      evaluaciones: 1,
      calificaciones: 1,
      clases_afectadas: ['5A'],
      profesores_afectados: 1,
    });

    // El primer intento no destruye nada
    const materias = await g('/api/subjects');
    expect(materias.body.data.some((m) => m.nombre === 'Matematicas')).toBe(true);
    expect(await Evaluation.countDocuments()).toBe(1);
    expect(await EvaluationGrade.countDocuments()).toBe(1);
  });

  it('con confirmar borra en cascada y no deja referencias colgadas - 200', async () => {
    await seedEscenario();

    const res = await d('/api/subjects', { nombre: 'Matematicas', confirmar: true });

    expect(res.status).toBe(200);

    // Las evaluaciones de la materia y sus notas se van con ella
    expect(await Evaluation.countDocuments()).toBe(0);
    expect(await EvaluationGrade.countDocuments()).toBe(0);

    // Y las referencias se limpian de verdad en la base, no solo en el populate: antes el
    // ObjectId quedaba guardado apuntando a una materia inexistente
    const clase = await GradeSection.findOne({ grado: '5', seccion: 'A' });
    expect(clase.materias).toHaveLength(0);

    const profesor = await Teacher.findOne();
    expect(profesor.grado_encargado[0].materias).toHaveLength(0);
  });

  it('falla si la materia no existe - 404', async () => {
    const res = await d('/api/subjects', { nombre: 'Inexistente', confirmar: true });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/gradeSections, borrado en dos pasos', () => {
  it('una clase con estudiantes matriculados no se puede borrar ni confirmando - 409', async () => {
    await seedEscenario({ conEstudiante: true });

    const res = await d('/api/gradeSections', { grado: '5', seccion: 'A', confirmar: true });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('estudiante');
    expect(res.body.impacto.estudiantes_matriculados).toBe(1);

    // La clase sigue en pie, para no dejar al alumno sin grado_seccion, que es obligatorio
    const clases = await g('/api/gradeSections');
    expect(clases.body.data.some((c) => c.grado === '5' && c.seccion === 'A')).toBe(true);
  });

  it('una clase sin estudiantes pero en uso no se borra sin confirmar - 409', async () => {
    await seedEscenario({ conEstudiante: false });

    const res = await d('/api/gradeSections', { grado: '5', seccion: 'A' });

    expect(res.status).toBe(409);
    expect(res.body.impacto.evaluaciones).toBe(1);
    expect(res.body.impacto.profesores_afectados).toBe(1);
    expect(res.body.impacto.estudiantes_matriculados).toBe(0);

    expect(await Evaluation.countDocuments()).toBe(1);
  });

  it('con confirmar borra en cascada y saca la asignación del profesor - 200', async () => {
    await seedEscenario({ conEstudiante: false });

    const res = await d('/api/gradeSections', { grado: '5', seccion: 'A', confirmar: true });

    expect(res.status).toBe(200);
    expect(await Evaluation.countDocuments()).toBe(0);

    // La asignación entera se va: una asignación sin su grado/sección no tiene sentido
    const profesor = await Teacher.findOne();
    expect(profesor.grado_encargado).toHaveLength(0);
  });

  it('falla si la clase no existe - 404', async () => {
    const res = await d('/api/gradeSections', { grado: '9', seccion: 'Z', confirmar: true });

    expect(res.status).toBe(404);
  });
});
