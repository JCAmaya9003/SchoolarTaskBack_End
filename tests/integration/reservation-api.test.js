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

  it('rechaza HTML/scripts en campos de texto libre, descripcion - 400, defensa XSS', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: '<script>alert(document.cookie)</script>',
        fecha_inicio: '2026-09-01T10:00:00.000Z',
        fecha_fin: '2026-09-01T12:00:00.000Z',
      });

    expect(res.status).toBe(400);
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

  it('rechaza un rango con fecha_fin anterior a fecha_inicio - 400', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Rango invertido',
        fecha_inicio: '2026-10-10T10:00:00.000Z',
        fecha_fin: '2026-10-01T12:00:00.000Z',
      });

    expect(res.status).toBe(400);
  });

  it('rechaza un rango con fecha_fin igual a fecha_inicio - 400', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Rango vacío',
        fecha_inicio: '2026-10-20T10:00:00.000Z',
        fecha_fin: '2026-10-20T10:00:00.000Z',
      });

    expect(res.status).toBe(400);
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
        fecha_inicio: '2026-09-01T10:00:00.000Z',
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
        fecha_inicio: '2026-09-05T10:00:00.000Z',
        nueva_fecha_inicio: '2026-09-05T10:00:00.000Z',
        nueva_fecha_fin: '2026-09-05T12:00:00.000Z',
      });

    expect(res.status).toBe(403);
  });

  it('admin puede reeditar una reserva sin moverla fuera de su propio horario - 200, antes el chequeo de solapamiento no excluía la propia reserva', async () => {
    const cookie = await loginAsAdmin();

    // La reserva quedó en Laboratorio A, 2026-09-01T14:00-16:00, tras el test anterior.
    // Reeditarla manteniendo el mismo lugar y horario, que se solapa consigo misma, no debe fallar.
    const res = await request
      .put('/api/reservations')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        nuevoLugar: 'Laboratorio A',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Segunda edición sin mover el horario',
        fecha_inicio: '2026-09-01T14:00:00.000Z',
        nueva_fecha_inicio: '2026-09-01T14:00:00.000Z',
        nueva_fecha_fin: '2026-09-01T16:00:00.000Z',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.descripcion).toBe('Segunda edición sin mover el horario');
  });

  it('rechaza un email mal formado - 400, antes el controller nunca llamaba validationResult', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/reservations')
      .set('Cookie', cookie)
      .send({
        lugar: 'Laboratorio A',
        nuevoLugar: 'Laboratorio A',
        usuarioEmail: 'no-es-un-email',
        descripcion: 'Descripción',
        fecha_inicio: '2026-09-01T14:00:00.000Z',
        nueva_fecha_inicio: '2026-09-01T14:00:00.000Z',
        nueva_fecha_fin: '2026-09-01T16:00:00.000Z',
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/reservations/by-time-range, validación', () => {
  it('rechaza fechas inválidas - 400, antes el controller nunca llamaba validationResult', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .get('/api/reservations/by-time-range')
      .set('Cookie', cookie)
      .query({ fecha_inicio: 'no-es-una-fecha', fecha_fin: '2026-09-01T12:00:00.000Z' });

    expect(res.status).toBe(400);
  });

  it('debe devolver las reservas del rango sin importar el lugar - 200, antes filtraba por lugar undefined y esta ruta siempre quedaba vacía', async () => {
    const cookie = await loginAsAdmin();

    await request.post('/api/reservations/create').set('Cookie', cookie).send({
      lugar: 'Auditorio',
      usuarioEmail: 'prof-b-reserva@test.com',
      descripcion: 'Reserva para probar el rango completo',
      fecha_inicio: '2026-12-01T10:00:00.000Z',
      fecha_fin: '2026-12-01T12:00:00.000Z',
    });

    const res = await request
      .get('/api/reservations/by-time-range')
      .set('Cookie', cookie)
      .query({ fecha_inicio: '2026-12-01T09:00:00.000Z', fecha_fin: '2026-12-01T13:00:00.000Z' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((r) => r.descripcion === 'Reserva para probar el rango completo')).toBe(true);
  });
});

describe('DELETE /api/reservations', () => {
  it('un teacher NO puede eliminar una reserva de otro profesor - 403', async () => {
    const cookie = await loginAs('prof-a-reserva@test.com', 'password123');

    const res = await request
      .delete('/api/reservations')
      .set('Cookie', cookie)
      .send({ lugar: 'Auditorio', usuarioEmail: 'prof-b-reserva@test.com', fecha_inicio: '2026-09-05T10:00:00.000Z' });

    expect(res.status).toBe(403);
  });

  it('admin puede eliminar una reserva - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/reservations')
      .set('Cookie', cookie)
      .send({ lugar: 'Laboratorio A', usuarioEmail: 'prof-a-reserva@test.com', fecha_inicio: '2026-09-01T14:00:00.000Z' });

    expect(res.status).toBe(200);
  });

  it('falla si la reserva no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/reservations')
      .set('Cookie', cookie)
      .send({ lugar: 'Laboratorio A', usuarioEmail: 'prof-a-reserva@test.com', fecha_inicio: '2026-09-01T14:00:00.000Z' });

    expect(res.status).toBe(404);
  });

  it('borra la reserva indicada por su fecha, no una al azar de las del mismo lugar - regresión', async () => {
    const cookie = await loginAsAdmin();

    // Tres reservas del mismo profe en el mismo lugar, en días distintos
    const dias = [
      { descripcion: 'lunes', inicio: '2026-11-02T10:00:00.000Z', fin: '2026-11-02T12:00:00.000Z' },
      { descripcion: 'martes', inicio: '2026-11-03T10:00:00.000Z', fin: '2026-11-03T12:00:00.000Z' },
      { descripcion: 'miercoles', inicio: '2026-11-04T10:00:00.000Z', fin: '2026-11-04T12:00:00.000Z' },
    ];
    for (const d of dias) {
      await request.post('/api/reservations/create').set('Cookie', cookie).send({
        lugar: 'Auditorio', usuarioEmail: 'prof-b-reserva@test.com',
        descripcion: d.descripcion, fecha_inicio: d.inicio, fecha_fin: d.fin,
      });
    }

    // Se pide borrar "martes" explícitamente por su fecha de inicio
    const del = await request
      .delete('/api/reservations')
      .set('Cookie', cookie)
      .send({ lugar: 'Auditorio', usuarioEmail: 'prof-b-reserva@test.com', fecha_inicio: '2026-11-03T10:00:00.000Z' });

    expect(del.status).toBe(200);
    expect(del.body.data.descripcion).toBe('martes');

    // Lunes y miércoles sobreviven; martes se fue
    const restantes = await request
      .get('/api/reservations/by-teacher')
      .query({ usuarioEmail: 'prof-b-reserva@test.com' })
      .set('Cookie', cookie);
    const descripciones = restantes.body.data.map((r) => r.descripcion);
    expect(descripciones).toContain('lunes');
    expect(descripciones).toContain('miercoles');
    expect(descripciones).not.toContain('martes');
  });
});

describe('DELETE /api/reservations/id, admin', () => {
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

describe('Reservas cuyo lugar fue borrado del catálogo', () => {
  it('los listados siguen respondiendo 200 y no se caen - regresión', async () => {
    const cookie = await loginAsAdmin();

    // Lugar propio de este test, para no afectar a las reservas de los demás
    await request.post('/api/academic_places').set('Cookie', cookie).send({ lugar: 'Gimnasio Temporal' });

    await request
      .post('/api/reservations/create')
      .set('Cookie', cookie)
      .send({
        lugar: 'Gimnasio Temporal',
        usuarioEmail: 'prof-a-reserva@test.com',
        descripcion: 'Clase de educación física',
        fecha_inicio: '2027-01-10T08:00:00.000Z',
        fecha_fin: '2027-01-10T10:00:00.000Z',
      });

    // El admin borra el lugar: la reserva queda apuntando a un lugar inexistente
    await request.delete('/api/academic_places').set('Cookie', cookie).send({ lugar: 'Gimnasio Temporal' });

    // Antes esto tiraba 500: formatReservationResponse hacía reservation.lugar.lugar sobre null
    const todas = await request.get('/api/reservations/all').set('Cookie', cookie);
    expect(todas.status).toBe(200);

    const porRango = await request
      .get('/api/reservations/by-time-range')
      .query({ fecha_inicio: '2027-01-01T00:00:00.000Z', fecha_fin: '2027-12-31T00:00:00.000Z' })
      .set('Cookie', cookie);
    expect(porRango.status).toBe(200);

    const porProfesor = await request
      .get('/api/reservations/by-teacher')
      .query({ usuarioEmail: 'prof-a-reserva@test.com' })
      .set('Cookie', cookie);
    expect(porProfesor.status).toBe(200);

    // La reserva huérfana sigue apareciendo, solo que sin lugar
    const huerfana = porProfesor.body.data.find((r) => r.descripcion === 'Clase de educación física');
    expect(huerfana).toBeDefined();
    expect(huerfana.lugar).toBeUndefined();
  });
});
