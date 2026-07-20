import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-evaluation@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const gradeSectionData = { grado: '3', seccion: 'A', materias: ['Matematicas', 'Historia'] };

const buildTeacher = (email, materia) => ({
  nombre: 'Laura',
  apellido: 'Profesora',
  email,
  password: 'password123',
  rolNombre: 'teacher',
  fecha_nacimiento: '1985-03-10',
  genero: 'Femenino',
  domicilio: 'Casa 2',
  nacionalidad: 'Venezolana',
  asignaciones: [
    {
      grado: gradeSectionData.grado,
      seccion: gradeSectionData.seccion,
      materias: [materia],
    },
  ],
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

  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Matematicas' });
  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Historia' });
  await request.post('/api/gradeSections').set('Cookie', adminCookie).send(gradeSectionData);

  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-mate-eval@test.com', 'Matematicas'));
  await request.post('/api/teachers').set('Cookie', adminCookie).send(buildTeacher('prof-historia-eval@test.com', 'Historia'));
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/evaluations', () => {
  it('admin puede crear una evaluación - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial 1', nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: 'Primer parcial', fecha: '2026-08-01', peso: 0.3 });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.materia).toBe('Matematicas');
  });

  it('falla si la materia no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial X', nombreMateria: 'MateriaFantasma', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: 'desc', fecha: '2026-08-01', peso: 0.3 });

    expect(res.status).toBe(404);
  });

  it('rechaza HTML/scripts en campos de texto libre, descripcion - 400, defensa XSS', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial XSS', nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: '<script>alert(document.cookie)</script>', fecha: '2026-08-01', peso: 0.3 });

    expect(res.status).toBe(400);
  });

  it('falla si la evaluación ya existe para esa materia - 409', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial 1', nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: 'Duplicada', fecha: '2026-08-01', peso: 0.3 });

    expect(res.status).toBe(409);
  });

  it('un teacher puede crear una evaluación en su propia materia - 201', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Quiz 1', nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: 'Quiz', fecha: '2026-08-05', peso: 0.1 });

    expect(res.status).toBe(201);
  });

  it('un teacher NO puede crear una evaluación en materia ajena - 403', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Quiz Historia', nombreMateria: 'Historia', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: 'Quiz', fecha: '2026-08-05', peso: 0.1 });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/evaluations', () => {
  it('admin ve evaluaciones de todas las materias - 200', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial Historia 1', nombreMateria: 'Historia', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: 'desc', fecha: '2026-08-02', peso: 0.3 });

    const res = await request.get('/api/evaluations').set('Cookie', cookie).query({ limit: 50 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    const materias = res.body.data.items.map((item) => item.materia);
    expect(materias).toContain('Matematicas');
    expect(materias).toContain('Historia');
  });

  it('un teacher solo ve evaluaciones de sus propias materias - 200', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request.get('/api/evaluations').set('Cookie', cookie).query({ limit: 50 });

    expect(res.status).toBe(200);
    const materias = res.body.data.items.map((item) => item.materia);
    expect(materias.every((materia) => materia === 'Matematicas')).toBe(true);
    expect(materias).not.toContain('Historia');
  });
});

describe('PUT /api/evaluations', () => {
  it('admin puede editar una evaluación - 200', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/evaluations')
      .set('Cookie', cookie)
      .send({
        nombre: 'Parcial 1',
        nuevoNombre: 'Parcial 1 (editado)',
        nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion,
        nuevaMateria: 'Matematicas',
        descripcion: 'Editada',
        fecha: '2026-08-03',
        peso: 0.35,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Parcial 1 (editado)');
  });

  it('falla si la evaluación no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/evaluations')
      .set('Cookie', cookie)
      .send({
        nombre: 'No existe',
        nuevoNombre: 'Nuevo',
        nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion,
        nuevaMateria: 'Matematicas',
        descripcion: 'desc',
        fecha: '2026-08-03',
        peso: 0.2,
      });

    expect(res.status).toBe(404);
  });

  it('un teacher NO puede editar una evaluación de materia ajena - 403', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .put('/api/evaluations')
      .set('Cookie', cookie)
      .send({
        nombre: 'Parcial Historia 1',
        nuevoNombre: 'Hackeado',
        nombreMateria: 'Historia', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion,
        nuevaMateria: 'Historia',
        descripcion: 'desc',
        fecha: '2026-08-03',
        peso: 0.2,
      });

    expect(res.status).toBe(403);
  });

  it('un teacher NO puede reasignar su propia evaluación a una materia ajena vía nuevaMateria - 403, antes verifyTeacherSubject solo validaba nombreMateria', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .put('/api/evaluations')
      .set('Cookie', cookie)
      .send({
        nombre: 'Quiz 1',
        nuevoNombre: 'Quiz 1',
        nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion,
        nuevaMateria: 'Historia',
        descripcion: 'Intento de reasignar a materia ajena',
        fecha: '2026-08-05',
        peso: 0.1,
      });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/evaluations', () => {
  it('admin puede eliminar una evaluación - 200', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'A eliminar', nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion, descripcion: 'desc', fecha: '2026-08-06', peso: 0.1 });

    const res = await request
      .delete('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'A eliminar', nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion });

    expect(res.status).toBe(200);
  });

  it('un teacher NO puede eliminar una evaluación de materia ajena - 403', async () => {
    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');

    const res = await request
      .delete('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'Parcial Historia 1', nombreMateria: 'Historia', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion });

    expect(res.status).toBe(403);
  });

  it('falla si la evaluación no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/evaluations')
      .set('Cookie', cookie)
      .send({ nombre: 'No existe', nombreMateria: 'Matematicas', grado: gradeSectionData.grado, seccion: gradeSectionData.seccion });

    expect(res.status).toBe(404);
  });
});

describe('evaluaciones scopeadas por clase', () => {
  it('permite el mismo nombre+materia en dos grados/secciones distintos - 201 en ambos', async () => {
    const cookie = await loginAsAdmin();
    // Otra clase con la misma materia
    await request.post('/api/gradeSections').set('Cookie', cookie).send({ grado: '5', seccion: 'B', materias: ['Matematicas'] });

    const enTresA = await request.post('/api/evaluations').set('Cookie', cookie).send({
      nombre: 'Examen Compartido', nombreMateria: 'Matematicas', grado: '3', seccion: 'A', descripcion: 'd', fecha: '2026-08-01', peso: 0.3,
    });
    const enCincoB = await request.post('/api/evaluations').set('Cookie', cookie).send({
      nombre: 'Examen Compartido', nombreMateria: 'Matematicas', grado: '5', seccion: 'B', descripcion: 'd', fecha: '2026-08-01', peso: 0.3,
    });

    // Mismo nombre + materia, distinta clase: no colisiona (antes habría dado 409)
    expect(enTresA.status).toBe(201);
    expect(enCincoB.status).toBe(201);
    expect(enCincoB.body.data.grado_seccion).toEqual({ grado: '5', seccion: 'B' });
  });

  it('un teacher NO puede operar su materia en una clase que no dicta - 403 (permiso a nivel de clase)', async () => {
    const adminCookie = await loginAsAdmin();
    // Clase nueva con Matematicas, donde prof-mate-eval NO está asignado (él da Mate en 3/A)
    await request.post('/api/gradeSections').set('Cookie', adminCookie).send({ grado: '6', seccion: 'C', materias: ['Matematicas'] });

    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');
    const res = await request.post('/api/evaluations').set('Cookie', cookie).send({
      nombre: 'Parcial Fuera de Clase', nombreMateria: 'Matematicas', grado: '6', seccion: 'C', descripcion: 'd', fecha: '2026-08-01', peso: 0.3,
    });

    // Dicta Matematicas, pero NO en 6/C: antes esto pasaba (permiso solo por materia), ahora 403
    expect(res.status).toBe(403);
  });

  it('un teacher NO ve en el listado evaluaciones de su materia en clases que no dicta - 200', async () => {
    const adminCookie = await loginAsAdmin();
    // Mate en su clase (3/A) y en una que no dicta (5/B, creada en un test anterior)
    await request.post('/api/evaluations').set('Cookie', adminCookie).send({
      nombre: 'Listado Clase', nombreMateria: 'Matematicas', grado: '3', seccion: 'A', descripcion: 'd', fecha: '2026-08-01', peso: 0.3,
    });
    await request.post('/api/evaluations').set('Cookie', adminCookie).send({
      nombre: 'Listado Clase', nombreMateria: 'Matematicas', grado: '5', seccion: 'B', descripcion: 'd', fecha: '2026-08-01', peso: 0.3,
    });

    const cookie = await loginAs('prof-mate-eval@test.com', 'password123');
    const res = await request.get('/api/evaluations').set('Cookie', cookie).query({ limit: 100 });

    expect(res.status).toBe(200);
    const clases = res.body.data.items
      .filter((e) => e.nombre === 'Listado Clase')
      .map((e) => `${e.grado_seccion.grado}${e.grado_seccion.seccion}`);
    expect(clases).toContain('3A');       // su clase: la ve
    expect(clases).not.toContain('5B');   // clase que no dicta: no la ve
  });
});
