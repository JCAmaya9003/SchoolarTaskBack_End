import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, clearTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;
let adminCookie;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Root',
  email: 'admin-rolchange@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

// Parent.telefono tiene índice único, así que cada padre necesita el suyo
const buildParent = (email, telefono = '+50312345678') => ({
  nombre: 'Pedro',
  apellido: 'Perez',
  fecha_nacimiento: '1980-03-03',
  email,
  password: 'password123',
  rolNombre: 'parent',
  genero: 'Masculino',
  domicilio: 'Calle 2',
  nacionalidad: 'Venezolana',
  telefono,
  telefono_trabajo: '+50387654321',
  lugar_trabajo: 'Oficina',
  profesion: 'Ingeniero',
});

const buildStudent = (email, emailPadre) => ({
  nombre: 'Ana',
  apellido: 'Perez',
  fecha_nacimiento: '2010-05-05',
  email,
  password: 'password123',
  rolNombre: 'student',
  genero: 'Femenino',
  domicilio: 'Calle 3',
  nacionalidad: 'Venezolana',
  email_padre: emailPadre,
  grado: '5',
  seccion: 'A',
  alergias: 'Ninguna',
  condiciones_medicas: 'Ninguna',
  contacto_emergencia: { nombre: 'Pedro Perez', telefono: '+50312345678' },
});

const datosDeProfesor = {
  asignaciones: [{ materias: ['Matematicas'], grado: '5', seccion: 'A' }],
  telefono: '+50311112222',
  especialidad: 'Matematicas',
};

async function login(email, password) {
  const res = await request.post('/api/users/login').send({ email, password });
  const cookies = res.headers['set-cookie'];
  return cookies ? cookies[0].split(';')[0] : null;
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
  adminCookie = await login(adminUser.email, adminUser.password);

  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Matematicas' });
  await request
    .post('/api/gradeSections')
    .set('Cookie', adminCookie)
    .send({ grado: '5', seccion: 'A', materias: ['Matematicas'] });
  await request.post('/api/parents').set('Cookie', adminCookie).send(buildParent('padre-rc@test.com'));
});

const changeRole = (payload) =>
  request.patch('/api/users/change-role').set('Cookie', adminCookie).send(payload);

describe('PATCH /api/users/change-role', () => {
  it('migra un estudiante a profesor: borra el perfil viejo y crea el nuevo - 200', async () => {
    await request
      .post('/api/students')
      .set('Cookie', adminCookie)
      .send(buildStudent('migrar-a-profe@test.com', 'padre-rc@test.com'));

    const res = await changeRole({
      email: 'migrar-a-profe@test.com',
      nuevoRol: 'teacher',
      ...datosDeProfesor,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.rol.nombre).toBe('teacher');

    // Ya no figura como estudiante y sí como profesor: User y perfil quedan sincronizados
    const estudiantes = await request.get('/api/students').set('Cookie', adminCookie);
    expect(estudiantes.body.data.items.some((e) => e.email === 'migrar-a-profe@test.com')).toBe(false);

    const profesores = await request.get('/api/teachers').set('Cookie', adminCookie);
    const migrado = profesores.body.data.items.find((p) => p.email === 'migrar-a-profe@test.com');
    expect(migrado).toBeDefined();
    expect(migrado.rol.nombre).toBe('teacher');
    expect(migrado.especialidad).toBe('Matematicas');
  });

  it('migra un padre a estudiante - 200', async () => {
    await request
      .post('/api/parents')
      .set('Cookie', adminCookie)
      .send(buildParent('migrar-a-alumno@test.com', '+50399998888'));

    const res = await changeRole({
      email: 'migrar-a-alumno@test.com',
      nuevoRol: 'student',
      email_padre: 'padre-rc@test.com',
      grado: '5',
      seccion: 'A',
      alergias: 'Ninguna',
      condiciones_medicas: 'Ninguna',
      contacto_emergencia: { nombre: 'Pedro Perez', telefono: '+50312345678' },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.rol.nombre).toBe('student');

    const padres = await request.get('/api/parents').set('Cookie', adminCookie);
    expect(padres.body.data.items.some((p) => p.email === 'migrar-a-alumno@test.com')).toBe(false);

    const estudiantes = await request.get('/api/students').set('Cookie', adminCookie);
    expect(estudiantes.body.data.items.some((e) => e.email === 'migrar-a-alumno@test.com')).toBe(true);
  });

  it('si los datos del rol destino son inválidos no toca nada - 404', async () => {
    await request
      .post('/api/students')
      .set('Cookie', adminCookie)
      .send(buildStudent('no-migra@test.com', 'padre-rc@test.com'));

    // La materia no existe: la creación del perfil de profesor falla
    const res = await changeRole({
      email: 'no-migra@test.com',
      nuevoRol: 'teacher',
      asignaciones: [{ materias: ['Quimica'], grado: '5', seccion: 'A' }],
      telefono: '+50311112222',
      especialidad: 'Quimica',
    });

    expect(res.status).toBe(404);

    // El perfil viejo sigue intacto: se crea el nuevo antes de borrar el viejo, justamente por esto
    const estudiantes = await request.get('/api/students').set('Cookie', adminCookie);
    const sigue = estudiantes.body.data.items.find((e) => e.email === 'no-migra@test.com');
    expect(sigue).toBeDefined();
    expect(sigue.rol.nombre).toBe('student');
  });

  it('rechaza migrar al rol que el usuario ya tiene - 409', async () => {
    await request
      .post('/api/students')
      .set('Cookie', adminCookie)
      .send(buildStudent('mismo-rol@test.com', 'padre-rc@test.com'));

    const res = await changeRole({
      email: 'mismo-rol@test.com',
      nuevoRol: 'student',
      email_padre: 'padre-rc@test.com',
      grado: '5',
      seccion: 'A',
      alergias: 'Ninguna',
      condiciones_medicas: 'Ninguna',
      contacto_emergencia: { nombre: 'Pedro Perez', telefono: '+50312345678' },
    });

    expect(res.status).toBe(409);
  });

  it('exige los datos del perfil destino - 400', async () => {
    await request
      .post('/api/students')
      .set('Cookie', adminCookie)
      .send(buildStudent('sin-datos@test.com', 'padre-rc@test.com'));

    // Migrar a teacher sin telefono ni especialidad ni asignaciones
    const res = await changeRole({ email: 'sin-datos@test.com', nuevoRol: 'teacher' });

    expect(res.status).toBe(400);
  });

  it('rechaza a quien no sea admin - 403', async () => {
    await request
      .post('/api/students')
      .set('Cookie', adminCookie)
      .send(buildStudent('alumno-curioso@test.com', 'padre-rc@test.com'));
    const studentCookie = await login('alumno-curioso@test.com', 'password123');

    const res = await request
      .patch('/api/users/change-role')
      .set('Cookie', studentCookie)
      .send({ email: 'alumno-curioso@test.com', nuevoRol: 'admin' });

    expect(res.status).toBe(403);
  });

  it('falla si el usuario no existe - 404', async () => {
    const res = await changeRole({ email: 'fantasma@test.com', nuevoRol: 'admin' });

    expect(res.status).toBe(404);
  });
});
