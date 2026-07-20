import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-role@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

async function loginAsAdmin() {
  const res = await request.post('/api/users/login').send({
    email: adminUser.email,
    password: adminUser.password,
  });
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
}

beforeAll(async () => {
  await setupTestDB();
  await Role.create({ nombre: 'admin' });
  await Role.create({ nombre: 'teacher' });
  await Role.create({ nombre: 'parent' });
  await Role.create({ nombre: 'student' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('GET /api/roles, admin', () => {
  it('debe listar los 4 roles del catálogo fijo - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request.get('/api/roles').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const nombres = res.body.data.map((r) => r.nombre);
    expect(nombres).toEqual(expect.arrayContaining(['admin', 'teacher', 'parent', 'student']));
    expect(res.body.data[0].id).toBeDefined();
  });

  it('debe rechazar sin autenticación - 401', async () => {
    const res = await request.get('/api/roles');

    expect(res.status).toBe(401);
  });
});

describe('rolNombre forzado en los flujos de creación admin-only', () => {
  it('ignora el rolNombre del body y liga el perfil al rol correcto del endpoint - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/parents')
      .set('Cookie', cookie)
      .send({
        nombre: 'Pedro',
        apellido: 'Padre',
        email: 'padre-rol-forzado@test.com',
        password: 'password123',
        rolNombre: 'admin', // intento de ligar el perfil de padre a un user con rol admin
        fecha_nacimiento: '1980-01-01',
        genero: 'Masculino',
        domicilio: 'Calle 1',
        nacionalidad: 'Venezolana',
        telefono: '+50312345678',
        telefono_trabajo: '+50312345679',
        lugar_trabajo: 'Oficina',
        profesion: 'Ingeniero',
      });

    expect(res.status).toBe(201);
    // El rol se fuerza a 'parent' en el servidor, no se toma el 'admin' del body
    expect(res.body.data.rol.nombre).toBe('parent');
  });
});
