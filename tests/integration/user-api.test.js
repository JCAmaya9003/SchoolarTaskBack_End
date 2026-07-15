import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const testUser = {
  nombre: 'Maria',
  apellido: 'Garcia',
  email: 'maria@test.com',
  password: 'password123',
  fecha_nacimiento: '1995-06-15',
  rolNombre: 'student',
  genero: 'Femenino',
  domicilio: 'Av Principal 456',
  nacionalidad: 'Venezolana',
};

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

beforeAll(async () => {
  await setupTestDB();
  await Role.create({ nombre: 'student' });
  await Role.create({ nombre: 'admin' });

  // Importar app después de conectar la BD
  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  const mongoose = (await import('mongoose')).default;
  await mongoose.connection.collection('users').deleteMany({});
});

// Helper para registrar y hacer login como admin
async function loginAsAdmin() {
  await request.post('/api/users/register').send(adminUser);
  const res = await request.post('/api/users/login').send({
    email: adminUser.email,
    password: adminUser.password,
  });
  // El token ya no viaja en el body, solo en la cookie httpOnly
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
}

describe('POST /api/users/register', () => {
  it('debe registrar un usuario nuevo - 200', async () => {
    const res = await request.post('/api/users/register').send(testUser);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Usuario creado con éxito');
    expect(res.body.Email).toBe('maria@test.com');
  });

  it('debe rechazar registro duplicado - 500', async () => {
    await request.post('/api/users/register').send(testUser);
    const res = await request.post('/api/users/register').send(testUser);

    expect(res.status).toBe(500);
  });

  it('debe rechazar datos inválidos - 400', async () => {
    const res = await request.post('/api/users/register').send({
      nombre: '123', // nombre con números
      email: 'invalido',
      password: '12345', // muy corta
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/users/login', () => {
  beforeEach(async () => {
    await request.post('/api/users/register').send(testUser);
  });

  it('debe hacer login exitoso y setear cookie httpOnly - 200', async () => {
    const res = await request.post('/api/users/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Inicio de sesión exitoso');
    expect(res.body.token).toBeUndefined();
    // El token viaja solo en la cookie, no en el body
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('debe rechazar credenciales incorrectas - 401', async () => {
    const res = await request.post('/api/users/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  it('debe rechazar email no registrado - 401', async () => {
    const res = await request.post('/api/users/login').send({
      email: 'noexiste@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });
});

describe('POST /api/users/forgot-password', () => {
  beforeEach(async () => {
    await request.post('/api/users/register').send(testUser);
  });

  it('debe generar token de reset - 200', async () => {
    const res = await request.post('/api/users/forgot-password').send({
      email: testUser.email,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('recuperación');
    expect(res.body.data.resetToken).toBeDefined(); // Disponible en modo no-producción
    expect(res.body.data.resetToken).toHaveLength(64);
  });

  it('debe responder igual con email inexistente (anti user-enumeration) - 200', async () => {
    const res = await request.post('/api/users/forgot-password').send({
      email: 'noexiste@test.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('recuperación');
    expect(res.body.data.resetToken).toBeUndefined();
  });
});

describe('POST /api/users/reset-password/:token', () => {
  beforeEach(async () => {
    await request.post('/api/users/register').send(testUser);
  });

  it('debe restablecer la contraseña con token válido - 200', async () => {
    // Obtener token de reset
    const forgotRes = await request.post('/api/users/forgot-password').send({
      email: testUser.email,
    });
    const resetToken = forgotRes.body.data.resetToken;

    // Resetear contraseña
    const resetRes = await request
      .post(`/api/users/reset-password/${resetToken}`)
      .send({ password: 'newPassword123' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain('actualizada');

    // Verificar que la nueva contraseña funciona
    const loginRes = await request.post('/api/users/login').send({
      email: testUser.email,
      password: 'newPassword123',
    });
    expect(loginRes.status).toBe(200);
  });

  it('debe rechazar token inválido - 400', async () => {
    const fakeToken = 'a'.repeat(64);
    const res = await request
      .post(`/api/users/reset-password/${fakeToken}`)
      .send({ password: 'newPassword123' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/users (admin)', () => {
  it('debe retornar todos los usuarios si es admin - 200', async () => {
    const cookies = await loginAsAdmin();

    const res = await request
      .get('/api/users')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('debe rechazar sin autenticación - 401', async () => {
    const res = await request.get('/api/users');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/me', () => {
  beforeEach(async () => {
    await request.post('/api/users/register').send(testUser);
  });

  it('debe devolver el email del usuario autenticado - 200', async () => {
    const loginRes = await request.post('/api/users/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request.get('/api/users/me').set('Cookie', cookie.split(';')[0]);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('debe rechazar sin autenticación - 401', async () => {
    const res = await request.get('/api/users/me');

    expect(res.status).toBe(401);
  });
});
