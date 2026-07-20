import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;
let alumnoCookie;
let adminCookie;

const adminUser = {
  nombre: 'Admin', apellido: 'Root', email: 'admin-sv@test.com', password: 'admin123456',
  fecha_nacimiento: '1990-01-01', rolNombre: 'admin', genero: 'Masculino',
  domicilio: 'Admin St', nacionalidad: 'Venezolana',
};

const PADRE = 'padre-sv@test.com';
const ALUMNO = 'alumno-sv@test.com';
const PROFE = 'profe-sv@test.com';

async function login(email, password) {
  const res = await request.post('/api/users/login').send({ email, password });
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
}

const getInfo = (cookie, email, rolNombre) =>
  request.post('/api/users/get-info').set('Cookie', cookie).send({ email, rolNombre });

beforeAll(async () => {
  await setupTestDB();
  for (const nombre of ['admin', 'teacher', 'student', 'parent']) {
    await Role.create({ nombre });
  }

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
  adminCookie = await login(adminUser.email, adminUser.password);
  const post = (url, body) => request.post(url).set('Cookie', adminCookie).send(body);

  await post('/api/subjects', { nombre: 'Matematicas' });
  await post('/api/gradeSections', { grado: '5', seccion: 'A', materias: ['Matematicas'] });

  await post('/api/parents', {
    nombre: 'Pedro', apellido: 'Padre', fecha_nacimiento: '1975-12-25', email: PADRE,
    password: 'password123', rolNombre: 'parent', genero: 'Masculino',
    domicilio: 'Casa familiar 123', nacionalidad: 'Colombiana',
    telefono: '+50311110000', telefono_trabajo: '+50387654321',
    lugar_trabajo: 'Banco Central, piso 12', profesion: 'Ingeniero',
  });

  await post('/api/teachers', {
    nombre: 'Carlos', apellido: 'Profesor', email: PROFE, password: 'password123',
    fecha_nacimiento: '1985-07-07', rolNombre: 'teacher', genero: 'Masculino',
    domicilio: 'Casa profe', nacionalidad: 'Venezolana',
    asignaciones: [{ materias: ['Matematicas'], grado: '5', seccion: 'A' }],
    telefono: '+50355556666', especialidad: 'Matematicas',
  });

  await post('/api/students', {
    nombre: 'Ana', apellido: 'Alumna', fecha_nacimiento: '2010-05-05', email: ALUMNO,
    password: 'password123', rolNombre: 'student', genero: 'Femenino',
    domicilio: 'Casa familiar 123', nacionalidad: 'Venezolana',
    email_padre: PADRE, grado: '5', seccion: 'A',
    alergias: 'Ninguna', condiciones_medicas: 'Ninguna',
    contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50399887766' },
  });

  alumnoCookie = await login(ALUMNO, 'password123');
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/users/get-info, lo que el alumno ve de su padre', () => {
  it('ve cómo contactarlo, pero no sus datos laborales ni personales - 200', async () => {
    const res = await getInfo(alumnoCookie, ALUMNO, 'student');

    expect(res.status).toBe(200);

    // Sus propios datos no se tocan
    expect(res.body.data.nombre).toBe('Ana');
    expect(res.body.data.grado_seccion.grado).toBe('5');

    // Del padre, solo el contacto
    expect(res.body.data.padre.usuario.nombre).toBe('Pedro');
    expect(res.body.data.padre.usuario.email).toBe(PADRE);
    expect(res.body.data.padre.usuario.domicilio).toBe('Casa familiar 123');
    expect(res.body.data.padre.telefono).toBe('+50311110000');

    // Nada de dónde ni de qué trabaja
    expect(res.body.data.padre.telefono_trabajo).toBeUndefined();
    expect(res.body.data.padre.lugar_trabajo).toBeUndefined();
    expect(res.body.data.padre.profesion).toBeUndefined();

    // Ni sus datos personales
    expect(res.body.data.padre.usuario.fecha_nacimiento).toBeUndefined();
    expect(res.body.data.padre.usuario.genero).toBeUndefined();
    expect(res.body.data.padre.usuario.nacionalidad).toBeUndefined();
  });
});

describe('POST /api/users/get-info, el recorte no afecta a los demás roles', () => {
  it('el admin sigue viendo el registro completo del padre - 200', async () => {
    const res = await getInfo(adminCookie, ALUMNO, 'student');

    expect(res.status).toBe(200);
    expect(res.body.data.padre.lugar_trabajo).toBe('Banco Central, piso 12');
    expect(res.body.data.padre.profesion).toBe('Ingeniero');
  });

  it('el profesor de ese alumno sigue viendo el registro completo del padre - 200', async () => {
    const cookie = await login(PROFE, 'password123');

    const res = await getInfo(cookie, ALUMNO, 'student');

    expect(res.status).toBe(200);
    expect(res.body.data.padre.telefono_trabajo).toBe('+50387654321');
    expect(res.body.data.padre.lugar_trabajo).toBe('Banco Central, piso 12');
  });

  it('el propio padre sigue viendo su ficha completa - 200', async () => {
    const cookie = await login(PADRE, 'password123');

    const res = await getInfo(cookie, PADRE, 'parent');

    expect(res.status).toBe(200);
    expect(res.body.data.lugar_trabajo).toBe('Banco Central, piso 12');
    expect(res.body.data.profesion).toBe('Ingeniero');
  });
});

describe('El alumno no puede manipular sus propias notas', () => {
  const nota = {
    email: ALUMNO,
    nombreMateria: 'Matematicas',
    nombreEvaluacion: 'Parcial',
    calificacion: 10,
  };

  beforeAll(async () => {
    await request.post('/api/evaluations').set('Cookie', adminCookie).send({
      nombre: 'Parcial', nombreMateria: 'Matematicas', grado: '5', seccion: 'A',
      descripcion: 'Parcial', fecha: '2026-03-01', peso: 25,
    });
    await request.post('/api/evaluation_grades').set('Cookie', adminCookie).send({ ...nota, calificacion: 5 });
  });

  it('no puede calificarse - 403', async () => {
    const res = await request.post('/api/evaluation_grades').set('Cookie', alumnoCookie).send(nota);

    expect(res.status).toBe(403);
  });

  it('no puede subirse la nota - 403', async () => {
    const res = await request.put('/api/evaluation_grades').set('Cookie', alumnoCookie).send(nota);

    expect(res.status).toBe(403);
  });

  it('no puede borrar una nota - 403', async () => {
    const res = await request.delete('/api/evaluation_grades').set('Cookie', alumnoCookie).send(nota);

    expect(res.status).toBe(403);

    // Y la nota original sigue intacta
    const suyas = await request
      .get('/api/evaluation_grades/by-student')
      .query({ email: ALUMNO })
      .set('Cookie', alumnoCookie);
    expect(suyas.body.data[0].calificacion).toBe(5);
  });

  it('no puede editar su propio perfil de estudiante - 403', async () => {
    const res = await request.put('/api/students').set('Cookie', alumnoCookie).send({
      email: ALUMNO, grado: '5', seccion: 'A', alergias: 'x', condiciones_medicas: 'x',
      contacto_emergencia: { nombre: 'X', telefono: '+50311111111' },
    });

    expect(res.status).toBe(403);
  });
});
