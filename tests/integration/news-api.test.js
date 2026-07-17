import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-news@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const buildStudentUser = (email) => ({
  nombre: 'Juan',
  apellido: 'Estudiante',
  email,
  password: 'password123',
  rolNombre: 'student',
  fecha_nacimiento: '2005-01-01',
  genero: 'Masculino',
  domicilio: 'Calle 1',
  nacionalidad: 'Venezolana',
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
  await Role.create({ nombre: 'student' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/news (admin)', () => {
  it('debe crear una noticia sobre un usuario existente - 201', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/users/register').send(buildStudentUser('estudiante1-news@test.com'));

    const res = await request
      .post('/api/news')
      .set('Cookie', cookie)
      .send({ email: 'estudiante1-news@test.com', titulo: 'Bienvenida', contenido: 'Contenido de bienvenida' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Noticia creada con éxito');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.titulo).toBe('Bienvenida');
    expect(res.body.data.autor.email).toBe('estudiante1-news@test.com');
  });

  it('rechaza HTML/scripts en el contenido - 400 (defensa XSS)', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/news')
      .set('Cookie', cookie)
      .send({
        email: 'estudiante1-news@test.com',
        titulo: 'Bienvenida',
        contenido: '<script>alert(document.cookie)</script>',
      });

    expect(res.status).toBe(400);
  });

  it('rechaza HTML/scripts en el título - 400 (defensa XSS)', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/news')
      .set('Cookie', cookie)
      .send({
        email: 'estudiante1-news@test.com',
        titulo: '<img src=x onerror=alert(1)>',
        contenido: 'Contenido normal',
      });

    expect(res.status).toBe(400);
  });

  it('debe fallar si la noticia ya existe para ese usuario - 409', async () => {
    const cookie = await loginAsAdmin();
    const payload = { email: 'estudiante1-news@test.com', titulo: 'Bienvenida', contenido: 'Otro contenido' };

    const res = await request.post('/api/news').set('Cookie', cookie).send(payload);

    expect(res.status).toBe(409);
  });

  it('debe fallar si el usuario no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/news')
      .set('Cookie', cookie)
      .send({ email: 'noexiste-news@test.com', titulo: 'Titulo', contenido: 'Contenido' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/news (admin/teacher/student)', () => {
  it('debe listar noticias paginadas - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/users/register').send(buildStudentUser('estudiante2-news@test.com'));
    await request
      .post('/api/news')
      .set('Cookie', cookie)
      .send({ email: 'estudiante2-news@test.com', titulo: 'Otra noticia', contenido: 'Contenido' });

    const res = await request.get('/api/news').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });
});

describe('GET /api/news/by-user', () => {
  it('un usuario puede ver sus propias noticias - 200', async () => {
    await request.post('/api/users/register').send(buildStudentUser('estudiante3-news@test.com'));
    const adminCookie = await loginAsAdmin();
    await request
      .post('/api/news')
      .set('Cookie', adminCookie)
      .send({ email: 'estudiante3-news@test.com', titulo: 'Noticia propia', contenido: 'Contenido' });

    const studentCookie = await loginAs('estudiante3-news@test.com', 'password123');
    const res = await request
      .get('/api/news/by-user')
      .set('Cookie', studentCookie)
      .query({ email: 'estudiante3-news@test.com' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('un admin puede ver las noticias de cualquier usuario - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .get('/api/news/by-user')
      .set('Cookie', cookie)
      .query({ email: 'estudiante3-news@test.com' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe fallar si el usuario no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .get('/api/news/by-user')
      .set('Cookie', cookie)
      .query({ email: 'noexiste-by-user@test.com' });

    expect(res.status).toBe(404);
  });

  it('un usuario NO puede ver las noticias de otro usuario - 403', async () => {
    await request.post('/api/users/register').send(buildStudentUser('estudiante-ajeno-news@test.com'));
    const studentCookie = await loginAs('estudiante3-news@test.com', 'password123');

    const res = await request
      .get('/api/news/by-user')
      .set('Cookie', studentCookie)
      .query({ email: 'estudiante-ajeno-news@test.com' });

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/news (admin)', () => {
  it('debe editar una noticia - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/users/register').send(buildStudentUser('estudiante4-news@test.com'));
    await request
      .post('/api/news')
      .set('Cookie', cookie)
      .send({ email: 'estudiante4-news@test.com', titulo: 'Titulo viejo', contenido: 'Contenido viejo' });

    const res = await request
      .put('/api/news')
      .set('Cookie', cookie)
      .send({
        email: 'estudiante4-news@test.com',
        titulo: 'Titulo viejo',
        nuevoTitulo: 'Titulo nuevo',
        contenido: 'Contenido nuevo',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe('Titulo nuevo');
    expect(res.body.data.contenido).toBe('Contenido nuevo');
  });

  it('debe fallar si la noticia no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/news')
      .set('Cookie', cookie)
      .send({
        email: 'estudiante4-news@test.com',
        titulo: 'No existe',
        nuevoTitulo: 'Titulo nuevo',
        contenido: 'Contenido nuevo',
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/news (admin)', () => {
  it('debe eliminar una noticia - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/users/register').send(buildStudentUser('estudiante5-news@test.com'));
    await request
      .post('/api/news')
      .set('Cookie', cookie)
      .send({ email: 'estudiante5-news@test.com', titulo: 'A eliminar', contenido: 'Contenido' });

    const res = await request
      .delete('/api/news')
      .set('Cookie', cookie)
      .send({ email: 'estudiante5-news@test.com', titulo: 'A eliminar' });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe('A eliminar');
  });

  it('debe fallar si la noticia no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/news')
      .set('Cookie', cookie)
      .send({ email: 'estudiante5-news@test.com', titulo: 'No existe' });

    expect(res.status).toBe(404);
  });
});
