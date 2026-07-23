import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, clearTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';
import Student from '../../src/models/student-model.js';
import User from '../../src/models/user-model.js';
import EvaluationGrade from '../../src/models/evaluation_grade.model.js';
import * as userRepository from '../../src/repositories/user-repository.js';

let app;
let request;
let adminCookie;

const adminUser = {
  nombre: 'Admin', apellido: 'Root', email: 'admin-tx@test.com', password: 'admin123456',
  fecha_nacimiento: '1990-01-01', rolNombre: 'admin', genero: 'Masculino',
  domicilio: 'Admin St', nacionalidad: 'Venezolana',
};

const ALUMNO = 'alumno-tx@test.com';
const PADRE = 'padre-tx@test.com';

async function login(email, password) {
  const res = await request.post('/api/users/login').send({ email, password });
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
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
  vi.restoreAllMocks();
  await clearTestDB();
  for (const nombre of ['admin', 'teacher', 'student', 'parent']) {
    await Role.create({ nombre });
  }
  await registerUserDirectly(adminUser);
  adminCookie = await login(adminUser.email, adminUser.password);
  const post = (url, body) => request.post(url).set('Cookie', adminCookie).send(body);

  await post('/api/subjects', { nombre: 'MateTx' });
  await post('/api/gradeSections', { grado: '6', seccion: 'T', materias: ['MateTx'] });
  await post('/api/parents', {
    nombre: 'Pedro', apellido: 'Padre', fecha_nacimiento: '1980-03-03', email: PADRE,
    password: 'password123', rolNombre: 'parent', genero: 'Masculino', domicilio: 'C2',
    nacionalidad: 'Venezolana', telefono: '+50311110000', telefono_trabajo: '+50387654321',
    lugar_trabajo: 'Oficina', profesion: 'Ingeniero',
  });
  await post('/api/students', {
    nombre: 'Ana', apellido: 'Alumna', fecha_nacimiento: '2010-05-05', email: ALUMNO,
    password: 'password123', rolNombre: 'student', genero: 'Femenino', domicilio: 'C3',
    nacionalidad: 'Venezolana', email_padre: PADRE, grado: '6', seccion: 'T',
    alergias: 'x', condiciones_medicas: 'x',
    contacto_emergencia: { nombre: 'X', telefono: '+50399887766' },
  });
  await post('/api/evaluations', {
    nombre: 'ParcialTx', nombreMateria: 'MateTx', grado: '6', seccion: 'T',
    descripcion: 'x', fecha: '2026-03-01', peso: 25,
  });
  await post('/api/evaluation_grades', {
    email: ALUMNO, nombreMateria: 'MateTx', nombreEvaluacion: 'ParcialTx', calificacion: 8,
  });
});

describe('Atomicidad de la baja de una persona', () => {
  it('la baja completa deja perfil borrado, usuario desactivado y notas borradas - 200', async () => {
    const res = await request.delete('/api/students').set('Cookie', adminCookie).send({ email: ALUMNO });

    expect(res.status).toBe(200);
    expect(await Student.countDocuments()).toBe(0);
    expect(await EvaluationGrade.countDocuments()).toBe(0);
    // El usuario queda desactivado (soft-delete), no borrado
    const usuario = await User.findOneWithDeleted({ email: ALUMNO });
    expect(usuario.deletedAt).not.toBeNull();
  });

  it('si la desactivación del usuario falla, no queda el perfil borrado: la transacción revierte todo', async () => {
    // Se rompe la ÚLTIMA escritura de la transacción, la que desactiva el usuario
    vi.spyOn(userRepository, 'deleteUserById').mockRejectedValueOnce(new Error('fallo simulado de la BD'));

    const res = await request.delete('/api/students').set('Cookie', adminCookie).send({ email: ALUMNO });

    expect(res.status).toBe(500);

    // Nada se aplicó: sin transacción, acá el perfil y las notas ya estarían borrados
    // y el usuario habría quedado vivo (estado imposible).
    expect(await Student.countDocuments()).toBe(1);
    expect(await EvaluationGrade.countDocuments()).toBe(1);

    // Y el alumno sigue operativo: aparece en el listado y puede entrar
    const listado = await request.get('/api/students').set('Cookie', adminCookie);
    expect(listado.body.data.items.some((s) => s.email === ALUMNO)).toBe(true);

    const loginRes = await request.post('/api/users/login').send({ email: ALUMNO, password: 'password123' });
    expect(loginRes.status).toBe(200);
  });
});
