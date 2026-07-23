import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;
let profeCookie;

// El profesor dicta SOLO Algebra en 4A. En 4B no dicta nada.
// alumnoPropio está en 4A; alumnoAjeno en 4B. Cada alumno tiene su propio padre.
const adminUser = {
  nombre: 'Admin', apellido: 'Root', email: 'admin-vis@test.com', password: 'admin123456',
  fecha_nacimiento: '1990-01-01', rolNombre: 'admin', genero: 'Masculino',
  domicilio: 'Admin St', nacionalidad: 'Venezolana',
};

const PROFE = 'profe-vis@test.com';
const OTRO_PROFE = 'otro-profe-vis@test.com';
const ALUMNO_PROPIO = 'alumno-propio-vis@test.com';
const ALUMNO_AJENO = 'alumno-ajeno-vis@test.com';
const PADRE_PROPIO = 'padre-propio-vis@test.com';
const PADRE_AJENO = 'padre-ajeno-vis@test.com';

const buildParent = (email, telefono) => ({
  nombre: 'Pedro', apellido: 'Padre', fecha_nacimiento: '1980-03-03', email,
  password: 'password123', rolNombre: 'parent', genero: 'Masculino',
  domicilio: 'Casa del padre', nacionalidad: 'Venezolana',
  telefono, telefono_trabajo: '+50387654321', lugar_trabajo: 'Banco', profesion: 'Ingeniero',
});

const buildStudent = (email, emailPadre, grado, seccion) => ({
  nombre: 'Ana', apellido: 'Alumna', fecha_nacimiento: '2010-05-05', email,
  password: 'password123', rolNombre: 'student', genero: 'Femenino',
  domicilio: 'Domicilio privado', nacionalidad: 'Venezolana',
  email_padre: emailPadre, grado, seccion,
  alergias: 'Alergia al mani', condiciones_medicas: 'Epilepsia',
  contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50399887766' },
});

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
  const admin = await login(adminUser.email, adminUser.password);
  const post = (url, body) => request.post(url).set('Cookie', admin).send(body);

  await post('/api/subjects', { nombre: 'Algebra' });
  await post('/api/gradeSections', { grado: '4', seccion: 'A', materias: ['Algebra'] });
  await post('/api/gradeSections', { grado: '4', seccion: 'B', materias: ['Algebra'] });

  await post('/api/parents', buildParent(PADRE_PROPIO, '+50311110000'));
  await post('/api/parents', buildParent(PADRE_AJENO, '+50322220000'));

  await post('/api/teachers', {
    nombre: 'Carlos', apellido: 'Profesor', email: PROFE, password: 'password123',
    fecha_nacimiento: '1985-07-07', rolNombre: 'teacher', genero: 'Masculino',
    domicilio: 'Casa del profe', nacionalidad: 'Venezolana',
    asignaciones: [{ materias: ['Algebra'], grado: '4', seccion: 'A' }],
    telefono: '+50355556666', especialidad: 'Algebra',
  });
  await post('/api/teachers', {
    nombre: 'Marta', apellido: 'Colega', email: OTRO_PROFE, password: 'password123',
    fecha_nacimiento: '1986-08-08', rolNombre: 'teacher', genero: 'Femenino',
    domicilio: 'Casa de la colega', nacionalidad: 'Venezolana',
    asignaciones: [{ materias: ['Algebra'], grado: '4', seccion: 'B' }],
    telefono: '+50377778888', especialidad: 'Historia',
  });

  await post('/api/students', buildStudent(ALUMNO_PROPIO, PADRE_PROPIO, '4', 'A'));
  await post('/api/students', buildStudent(ALUMNO_AJENO, PADRE_AJENO, '4', 'B'));

  profeCookie = await login(PROFE, 'password123');
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/users/get-info, alcance del profesor sobre alumnos', () => {
  it('ve el perfil completo de un alumno suyo, incluidos los datos médicos que necesita - 200', async () => {
    const res = await getInfo(profeCookie, ALUMNO_PROPIO, 'student');

    expect(res.status).toBe(200);
    expect(res.body.data.alergias).toBe('Alergia al mani');
    expect(res.body.data.condiciones_medicas).toBe('Epilepsia');
    expect(res.body.data.contacto_emergencia.telefono).toBe('+50399887766');
  });

  it('no ve a un alumno de una clase que no dicta - 403', async () => {
    const res = await getInfo(profeCookie, ALUMNO_AJENO, 'student');

    expect(res.status).toBe(403);
  });
});

describe('POST /api/users/get-info, alcance del profesor sobre padres', () => {
  it('ve al padre de un alumno suyo, que es a quien debe llamar - 200', async () => {
    const res = await getInfo(profeCookie, PADRE_PROPIO, 'parent');

    expect(res.status).toBe(200);
    expect(res.body.data.telefono).toBe('+50311110000');
  });

  it('no ve al padre de un alumno que no es suyo - 403', async () => {
    const res = await getInfo(profeCookie, PADRE_AJENO, 'parent');

    expect(res.status).toBe(403);
  });
});

describe('POST /api/users/get-info, entre profesores', () => {
  it('ve a un colega solo como directorio de contacto, sin sus datos personales - 200', async () => {
    const res = await getInfo(profeCookie, OTRO_PROFE, 'teacher');

    expect(res.status).toBe(200);
    // Lo que sirve para ubicarlo y saber qué dicta
    expect(res.body.data.nombre).toBe('Marta');
    expect(res.body.data.email).toBe(OTRO_PROFE);
    expect(res.body.data.telefono).toBe('+50377778888');
    expect(res.body.data.especialidad).toBe('Historia');
    expect(res.body.data.grado_encargado).toBeDefined();
    // Lo que no hace falta para contactarlo
    expect(res.body.data.domicilio).toBeUndefined();
    expect(res.body.data.genero).toBeUndefined();
    expect(res.body.data.nacionalidad).toBeUndefined();
  });

  it('sobre sí mismo sigue viendo su perfil completo - 200', async () => {
    const res = await getInfo(profeCookie, PROFE, 'teacher');

    expect(res.status).toBe(200);
    expect(res.body.data.domicilio).toBe('Casa del profe');
  });
});

describe('POST /api/users/get-info, el admin no queda restringido', () => {
  it('el admin ve el perfil completo de cualquier alumno - 200', async () => {
    const admin = await login(adminUser.email, adminUser.password);

    const res = await getInfo(admin, ALUMNO_AJENO, 'student');

    expect(res.status).toBe(200);
    expect(res.body.data.condiciones_medicas).toBe('Epilepsia');
    expect(res.body.data.domicilio).toBe('Domicilio privado');
  });

  it('el admin ve el perfil completo de cualquier profesor - 200', async () => {
    const admin = await login(adminUser.email, adminUser.password);

    const res = await getInfo(admin, OTRO_PROFE, 'teacher');

    expect(res.status).toBe(200);
    expect(res.body.data.domicilio).toBe('Casa de la colega');
  });
});
