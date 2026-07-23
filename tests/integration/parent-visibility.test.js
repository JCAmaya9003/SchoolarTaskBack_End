import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;
let padreCookie;

const adminUser = {
  nombre: 'Admin', apellido: 'Root', email: 'admin-pv@test.com', password: 'admin123456',
  fecha_nacimiento: '1990-01-01', rolNombre: 'admin', genero: 'Masculino',
  domicilio: 'Admin St', nacionalidad: 'Venezolana',
};

const PADRE = 'padre-pv@test.com';
const PADRE_SIN_HIJOS = 'padre-sin-hijos-pv@test.com';
const OTRO_PADRE = 'otro-padre-pv@test.com';
const HIJO = 'hijo-pv@test.com';
const HIJO_AJENO = 'hijo-ajeno-pv@test.com';

const buildParent = (email, telefono) => ({
  nombre: 'Pedro', apellido: 'Padre', fecha_nacimiento: '1980-03-03', email,
  password: 'password123', rolNombre: 'parent', genero: 'Masculino',
  domicilio: 'Casa del padre', nacionalidad: 'Venezolana',
  telefono, telefono_trabajo: '+50387654321', lugar_trabajo: 'Banco', profesion: 'Ingeniero',
});

const buildStudent = (email, emailPadre) => ({
  nombre: 'Ana', apellido: 'Alumna', fecha_nacimiento: '2010-05-05', email,
  password: 'password123', rolNombre: 'student', genero: 'Femenino',
  domicilio: 'Domicilio del alumno', nacionalidad: 'Venezolana',
  email_padre: emailPadre, grado: '5', seccion: 'A',
  alergias: 'Alergia al mani', condiciones_medicas: 'Epilepsia',
  contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50399887766' },
});

async function login(email, password) {
  const res = await request.post('/api/users/login').send({ email, password });
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
}

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

  await post('/api/subjects', { nombre: 'Matematicas' });
  await post('/api/gradeSections', { grado: '5', seccion: 'A', materias: ['Matematicas'] });

  await post('/api/parents', buildParent(PADRE, '+50311110000'));
  await post('/api/parents', buildParent(OTRO_PADRE, '+50322220000'));
  await post('/api/parents', buildParent(PADRE_SIN_HIJOS, '+50333330000'));

  await post('/api/students', buildStudent(HIJO, PADRE));
  await post('/api/students', buildStudent(HIJO_AJENO, OTRO_PADRE));

  await post('/api/news', { email: adminUser.email, titulo: 'Reunión', contenido: 'El lunes' });

  padreCookie = await login(PADRE, 'password123');
});

afterAll(async () => {
  await teardownTestDB();
});

describe('El padre y las noticias', () => {
  it('puede ver el feed de noticias, es un anuncio general del colegio - 200', async () => {
    const res = await request.get('/api/news').set('Cookie', padreCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.items.some((n) => n.titulo === 'Reunión')).toBe(true);
  });

  it('puede consultar by-user sobre sí mismo, igual que un estudiante - 200', async () => {
    const res = await request
      .get('/api/news/by-user')
      .query({ email: PADRE })
      .set('Cookie', padreCookie);

    expect(res.status).toBe(200);
  });

  it('pero no las de otro usuario, by-user sigue acotado al propio - 403', async () => {
    const res = await request
      .get('/api/news/by-user')
      .query({ email: adminUser.email })
      .set('Cookie', padreCookie);

    expect(res.status).toBe(403);
  });
});

describe('El padre y la ficha de sus hijos', () => {
  it('ve la ficha completa de su hijo - 200', async () => {
    const res = await request
      .post('/api/users/get-info')
      .set('Cookie', padreCookie)
      .send({ email: HIJO, rolNombre: 'student' });

    expect(res.status).toBe(200);
    expect(res.body.data.alergias).toBe('Alergia al mani');
    expect(res.body.data.condiciones_medicas).toBe('Epilepsia');
    expect(res.body.data.grado_seccion.grado).toBe('5');
  });

  it('ve el boletín de su hijo por students/get-all - 200', async () => {
    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', padreCookie)
      .send({ email: HIJO });

    expect(res.status).toBe(200);
    expect(res.body.data.map((m) => m.materia)).toContain('Matematicas');
  });

  it('no ve la ficha del hijo de otro padre - 403', async () => {
    const res = await request
      .post('/api/users/get-info')
      .set('Cookie', padreCookie)
      .send({ email: HIJO_AJENO, rolNombre: 'student' });

    expect(res.status).toBe(403);
  });

  it('no ve el boletín del hijo de otro padre - 403', async () => {
    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', padreCookie)
      .send({ email: HIJO_AJENO });

    expect(res.status).toBe(403);
  });

  it('no ve la ficha de otro padre - 403', async () => {
    const res = await request
      .post('/api/users/get-info')
      .set('Cookie', padreCookie)
      .send({ email: OTRO_PADRE, rolNombre: 'parent' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/students/get-students-filterWithParent', () => {
  it('devuelve las notas de todos sus hijos - 200', async () => {
    const res = await request
      .get('/api/students/get-students-filterWithParent')
      .set('Cookie', padreCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].estudiante.email).toBe(HIJO);
  });

  it('un padre sin hijos asignados recibe una lista vacía, no un error - 200', async () => {
    const cookie = await login(PADRE_SIN_HIJOS, 'password123');

    const res = await request
      .get('/api/students/get-students-filterWithParent')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
