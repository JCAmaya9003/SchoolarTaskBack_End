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

describe('Uso de un rol inexistente en un flujo admin-only, regresión: searchRoleByName tiraba throw en vez de null', () => {
  it('debe devolver 404 en vez de 500 si rolNombre no existe', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/parents')
      .set('Cookie', cookie)
      .send({
        nombre: 'Pedro',
        apellido: 'Padre',
        email: 'padre-rol-invalido@test.com',
        password: 'password123',
        rolNombre: 'rol-que-no-existe',
        fecha_nacimiento: '1980-01-01',
        genero: 'Masculino',
        domicilio: 'Calle 1',
        nacionalidad: 'Venezolana',
        telefono: '+50312345678',
        telefono_trabajo: '+50312345679',
        lugar_trabajo: 'Oficina',
        profesion: 'Ingeniero',
      });

    expect(res.status).toBe(404);
  });
});
