import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-reservation@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

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
  asignaciones: [],
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

  await request.post('/api/academic_places').set('Cookie', adminCookie).send({ lugar: 'Laboratorio A' });
  await request.post('/api/academic_places').set('Cookie', adminCookie).send({ lugar: 'Auditorio' });

  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-a-reserva@test.com'));
  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-b-reserva@test.com'));
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/reservations/create', () => {
  it('admin puede crear una reserva - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Clase de laboratorio',
        fecha_inicio: '2026-09-01T10:00:00.000Z',
        fecha_fin: '2026-09-01T12:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.lugar).toBe('Laboratorio A');
  });

  it('falla si el lugar ya está reservado en esas fechas - 409', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        usuarioEmail: 'prof-b-reserva@test.com',
        descripcion: 'Otra clase',
        fecha_inicio: '2026-09-01T11:00:00.000Z',
        fecha_fin: '2026-09-01T13:00:00.000Z',
      });

    expect(res.status).toBe(409);
  });

  it('falla si el lugar no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Lugar Fantasma',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'desc',
        fecha_inicio: '2026-09-02T10:00:00.000Z',
        fecha_fin: '2026-09-02T12:00:00.000Z',
      });

    expect(res.status).toBe(404);
  });

  it('un teacher puede crear su propia reserva - 201', async () => {
    const cookie = await loginAs('prof-a-reserva@test.com', 'password123');

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Auditorio',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Evento propio',
        fecha_inicio: '2026-09-03T10:00:00.000Z',
        fecha_fin: '2026-09-03T12:00:00.000Z',
      });

    expect(res.status).toBe(201);
  });

  it('un teacher NO puede crear una reserva a nombre de otro profesor - 403', async () => {
    const cookie = await loginAs('prof-a-reserva@test.com', 'password123');

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Auditorio',
        usuarioEmail: 'prof-b-reserva@test.com',
        descripcion: 'Suplantación',
        fecha_inicio: '2026-09-04T10:00:00.000Z',
        fecha_fin: '2026-09-04T12:00:00.000Z',
      });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/reservations/all', () => {
  it('admin puede listar todas las reservas paginadas - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.get('/api/reservations/all').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });
});

describe('GET /api/reservations/by-teacher', () => {
  it('un teacher NO puede ver las reservas de otro profesor - 403', async () => {
    const cookie = await loginAs('prof-a-reserva@test.com', 'password123');

    const res = await request
      .get('/api/reservations/by-teacher')
      .set('Cookie', cookie)
      .query({ usuarioEmail: 'prof-b-reserva@test.com' });

    expect(res.status).toBe(403);
  });

  it('un teacher puede ver sus propias reservas - 200', async () => {
    const cookie = await loginAs('prof-a-reserva@test.com', 'password123');

    const res = await request
      .get('/api/reservations/by-teacher')
      .set('Cookie', cookie)
      .query({ usuarioEmail: 'prof-a-reserva@test.com' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('PUT /api/reservations', () => {
  it('admin puede editar una reserva - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/reservations')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        nuevoLugar: 'Laboratorio A',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Descripción editada',
        nueva_fecha_inicio: '2026-09-01T14:00:00.000Z',
        nueva_fecha_fin: '2026-09-01T16:00:00.000Z',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.descripcion).toBe('Descripción editada');
    expect(res.body.data.lugar).toBe('Laboratorio A');
  });

  it('un teacher NO puede editar una reserva de otro profesor - 403', async () => {
    const cookie = await loginAs('prof-a-reserva@test.com', 'password123');

    const res = await request
      .put('/api/reservations')
      .set('Cookie', cookie)
      .send({
        lugar: 'Auditorio',
        nuevoLugar: 'Auditorio',
        usuarioEmail: 'prof-b-reserva@test.com',
        descripcion: 'Hackeo',
        nueva_fecha_inicio: '2026-09-05T10:00:00.000Z',
        nueva_fecha_fin: '2026-09-05T12:00:00.000Z',
      });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/reservations', () => {
  it('un teacher NO puede eliminar una reserva de otro profesor - 403', async () => {
    const cookie = await loginAs('prof-a-reserva@test.com', 'password123');

    const res = await request
      .delete('/api/reservations')
      .set('Cookie', cookie)
      .send({ lugar: 'Auditorio', usuarioEmail: 'prof-b-reserva@test.com' });

    expect(res.status).toBe(403);
  });

  it('admin puede eliminar una reserva - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/reservations')
      .set('Cookie', cookie)
      .send({ lugar: 'Laboratorio A', usuarioEmail: 'prof-a-reserva@test.com' });

    expect(res.status).toBe(200);
  });

  it('falla si la reserva no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/reservations')
      .set('Cookie', cookie)
      .send({ lugar: 'Laboratorio A', usuarioEmail: 'prof-a-reserva@test.com' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/reservations/id (admin)', () => {
  it('admin puede eliminar una reserva por id - 200', async () => {
    const cookie = await loginAsAdmin();
    const createRes = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Auditorio',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Para borrar por id',
        fecha_inicio: '2026-09-10T10:00:00.000Z',
        fecha_fin: '2026-09-10T12:00:00.000Z',
      });
    const reservationId = createRes.body.data.id;

    const res = await request
      .delete('/api/reservations/id')
      .set('Cookie', cookie)
      .send({ id: reservationId });

    expect(res.status).toBe(200);
  });

  it('falla si el id no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/reservations/id')
      .set('Cookie', cookie)
      .send({ id: '507f1f77bcf86cd799439011' });

    expect(res.status).toBe(404);
  });
});
