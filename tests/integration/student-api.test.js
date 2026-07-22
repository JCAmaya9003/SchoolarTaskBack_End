import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';
import EvaluationGrade from '../../src/models/evaluation_grade.model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-student@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const parentUser = {
  nombre: 'Pedro',
  apellido: 'Padre',
  email: 'pedro-padre@test.com',
  password: 'password123',
  fecha_nacimiento: '1980-01-01',
  rolNombre: 'parent',
  genero: 'Masculino',
  domicilio: 'Calle 1',
  nacionalidad: 'Venezolana',
  telefono: '+50312345678',
  telefono_trabajo: '+50312345679',
  lugar_trabajo: 'Oficina',
  profesion: 'Ingeniero',
};

const gradeSectionData = { grado: '1', seccion: 'A', materias: [] };

const buildStudent = (email) => ({
  nombre: 'Juan',
  apellido: 'Estudiante',
  email,
  password: 'password123',
  rolNombre: 'student',
  fecha_nacimiento: '2010-05-05',
  genero: 'Masculino',
  domicilio: 'Casa 1',
  nacionalidad: 'Venezolana',
  email_padre: parentUser.email,
  grado: gradeSectionData.grado,
  seccion: gradeSectionData.seccion,
  alergias: 'Ninguna',
  condiciones_medicas: 'Ninguna',
  contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
});

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
  await Role.create({ nombre: 'parent' });
  await Role.create({ nombre: 'student' });
  await Role.create({ nombre: 'teacher' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
  const adminCookie = await loginAsAdmin();

  await request.post('/api/parents').set('Cookie', adminCookie).send(parentUser);
  await request.post('/api/gradeSections').set('Cookie', adminCookie).send(gradeSectionData);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/students, admin', () => {
  it('debe crear un estudiante - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/students')
      .set('Cookie', cookie)
      .send(buildStudent('est1@test.com'));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Estudiante creado con éxito');
    expect(res.body.data.email).toBe('est1@test.com');
    expect(res.body.data.id).toBeDefined();

    // Antes estos campos no se populaban en ninguna query, y createStudent tampoco
    // anidaba padre.usuario
    expect(res.body.data.genero).toBe('Masculino');
    expect(res.body.data.domicilio).toBe('Casa 1');
    expect(res.body.data.nacionalidad).toBe('Venezolana');
    expect(res.body.data.fecha_nacimiento).toBeDefined();
    expect(res.body.data.padre.usuario.nombre).toBe('Pedro');
    expect(res.body.data.padre.usuario.email).toBe(parentUser.email);
    expect(res.body.data.grado_seccion.materias).toBeDefined();
  });

  it('rechaza HTML/scripts en campos de texto libre, domicilio - 400, defensa XSS', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/students')
      .set('Cookie', cookie)
      .send({ ...buildStudent('est-xss@test.com'), domicilio: '<script>alert(document.cookie)</script>' });

    expect(res.status).toBe(400);
  });

  it('debe fallar si el padre no existe - 404', async () => {
    const cookie = await loginAsAdmin();
    const payload = buildStudent('est2@test.com');
    payload.email_padre = 'noexiste-padre@test.com';

    const res = await request.post('/api/students').set('Cookie', cookie).send(payload);

    expect(res.status).toBe(404);
  });

  it('debe rechazar sin rol admin - 403', async () => {
    await registerUserDirectly({
      nombre: 'Otro', apellido: 'Usuario', email: 'no-admin@test.com', password: 'password123',
      rolNombre: 'student', fecha_nacimiento: '2000-01-01', genero: 'Masculino',
      domicilio: 'Casa', nacionalidad: 'Venezolana',
    });
    const loginRes = await request.post('/api/users/login').send({
      email: 'no-admin@test.com',
      password: 'password123',
    });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request
      .post('/api/students')
      .set('Cookie', cookie.split(';')[0])
      .send(buildStudent('est-noadmin@test.com'));

    expect(res.status).toBe(403);
  });
});

describe('GET /api/students, admin', () => {
  it('debe listar estudiantes paginados - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/students').set('Cookie', cookie).send(buildStudent('est3@test.com'));

    const res = await request.get('/api/students').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });

  it('oculta del listado a un estudiante cuyo usuario fue desactivado, sin caerse - 200', async () => {
    const cookie = await loginAsAdmin();
    const email = 'est-desactivado@test.com';
    await request.post('/api/students').set('Cookie', cookie).send(buildStudent(email));

    // Aparece en el listado antes de desactivar
    const before = await request.get('/api/students').set('Cookie', cookie);
    expect(before.body.data.items.some((s) => s.email === email)).toBe(true);

    // El admin desactiva (soft-delete) al usuario del estudiante
    const del = await request.delete('/api/users').set('Cookie', cookie).send({ email });
    expect(del.status).toBe(200);

    // El listado no se cae (antes daba 500 por usuario=null) y el desactivado ya no figura
    const after = await request.get('/api/students').set('Cookie', cookie);
    expect(after.status).toBe(200);
    expect(after.body.data.items.some((s) => s.email === email)).toBe(false);
  });

  it('la paginación no cuenta a los desactivados: items y totalItems coinciden - regresión', async () => {
    const cookie = await loginAsAdmin();
    // Base limpia de estudiantes para contar con exactitud
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.collection('students').deleteMany({});

    for (const e of ['pag1@test.com', 'pag2@test.com', 'pag3@test.com']) {
      await request.post('/api/students').set('Cookie', cookie).send(buildStudent(e));
    }
    // Se desactiva uno
    await request.delete('/api/users').set('Cookie', cookie).send({ email: 'pag2@test.com' });

    const res = await request.get('/api/students').set('Cookie', cookie);

    expect(res.status).toBe(200);
    // Antes: items 2, totalItems 3 (el filtro post-populate no descontaba del total)
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination.totalItems).toBe(2);
  });
});

describe('PUT /api/students, admin', () => {
  it('debe actualizar un estudiante - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/students').set('Cookie', cookie).send(buildStudent('est4@test.com'));

    const res = await request
      .put('/api/students')
      .set('Cookie', cookie)
      .send({
        email: 'est4@test.com',
        grado: gradeSectionData.grado,
        seccion: gradeSectionData.seccion,
        alergias: 'Polen',
        condiciones_medicas: 'Ninguna',
        contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.alergias).toBe('Polen');
  });

  it('debe fallar si el estudiante no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/students')
      .set('Cookie', cookie)
      .send({
        email: 'noexiste-est@test.com',
        grado: gradeSectionData.grado,
        seccion: gradeSectionData.seccion,
        alergias: 'Polen',
        condiciones_medicas: 'Ninguna',
        contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/students, admin', () => {
  it('debe eliminar un estudiante por email - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/students').set('Cookie', cookie).send(buildStudent('est5@test.com'));

    const res = await request
      .delete('/api/students')
      .set('Cookie', cookie)
      .send({ email: 'est5@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('est5@test.com');
  });

  it('debe fallar si el estudiante no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/students')
      .set('Cookie', cookie)
      .send({ email: 'noexiste-est2@test.com' });

    expect(res.status).toBe(404);
  });

  it('borrar un estudiante se lleva sus notas en cascada, no las deja huérfanas - regresión', async () => {
    const cookie = await loginAsAdmin();
    const email = 'est-con-notas-cascade@test.com';

    await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'MateCascade' });
    await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '9', seccion: 'K', materias: ['MateCascade'] });
    await request.post('/api/students').set('Cookie', cookie).send({
      ...buildStudent(email),
      grado: '9',
      seccion: 'K',
    });
    await request.post('/api/evaluations').set('Cookie', cookie).send({
      nombre: 'ParcialCascade', nombreMateria: 'MateCascade', grado: '9', seccion: 'K',
      descripcion: 'x', fecha: '2026-03-01', peso: 25,
    });
    await request.post('/api/evaluation_grades').set('Cookie', cookie).send({
      email, nombreMateria: 'MateCascade', nombreEvaluacion: 'ParcialCascade', calificacion: 8,
    });

    // Se cuenta sobre la base, no vía la API: los listados filtran las notas huérfanas (populate
    // -> null), así que una nota huérfana desaparecería de la respuesta igual, sin haberse borrado.
    expect(await EvaluationGrade.countDocuments()).toBe(1);

    await request.delete('/api/students').set('Cookie', cookie).send({ email });

    // Tras borrar el estudiante, su nota se fue de la base (antes quedaba huérfana para siempre)
    expect(await EvaluationGrade.countDocuments()).toBe(0);
  });
});

describe('DELETE /api/students, borrado por email', () => {
  it('ya no existe la ruta por id, que borraba el perfil sin desactivar el usuario - 404', async () => {
    const cookie = await loginAsAdmin();
    const createRes = await request
      .post('/api/students')
      .set('Cookie', cookie)
      .send(buildStudent('est6@test.com'));

    const res = await request
      .delete('/api/students/id')
      .set('Cookie', cookie)
      .send({ id: createRes.body.data.id });

    expect(res.status).toBe(404);
  });

  it('borrar por email devuelve el padre con su usuario populado - 200', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/students')
      .set('Cookie', cookie)
      .send(buildStudent('est-delete-padre@test.com'));

    const res = await request
      .delete('/api/students')
      .set('Cookie', cookie)
      .send({ email: 'est-delete-padre@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.padre.usuario.nombre).toBe(parentUser.nombre);
    expect(res.body.data.padre.usuario.email).toBe(parentUser.email);
  });
});

describe('POST /api/students/get-all, autorización', () => {
  it('un estudiante no puede pedir las notas de otro estudiante - 403', async () => {
    await request.post('/api/students').set('Cookie', await loginAsAdmin()).send(buildStudent('est7@test.com'));
    await request.post('/api/students').set('Cookie', await loginAsAdmin()).send(buildStudent('est8@test.com'));

    const loginRes = await request.post('/api/users/login').send({
      email: 'est7@test.com',
      password: 'password123',
    });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', cookie.split(';')[0])
      .send({ email: 'est8@test.com' });

    expect(res.status).toBe(403);
  });

  it('rechaza un email mal formado - 400, antes getStudentGradesInfo nunca llamaba validationResult', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', cookie)
      .send({ email: 'no-es-un-email' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/students/get-all, clase sin materias', () => {
  it('un alumno en una clase recién creada sin materias recibe un boletín vacío, no un 404', async () => {
    const cookie = await loginAsAdmin();
    await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '11', seccion: 'W', materias: [] });
    const email = 'alumno-clase-vacia@test.com';
    await request.post('/api/students').set('Cookie', cookie).send({
      ...buildStudent(email),
      grado: '11',
      seccion: 'W',
    });

    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', cookie)
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/students/get-all, con materias asignadas', () => {
  it('debe devolver las notas sin crashear - 200, antes subject._id quedaba undefined por un remapeo a subject.id', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'MateriaConNotas' });
    await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '9', seccion: 'Z', materias: ['MateriaConNotas'] });

    const studentEmail = 'est-con-notas@test.com';
    await request.post('/api/students').set('Cookie', cookie).send({
      nombre: 'Ana',
      apellido: 'Estudiante',
      email: studentEmail,
      password: 'password123',
      rolNombre: 'student',
      fecha_nacimiento: '2011-01-01',
      genero: 'Femenino',
      domicilio: 'Casa 9',
      nacionalidad: 'Venezolana',
      email_padre: parentUser.email,
      grado: '9',
      seccion: 'Z',
      alergias: 'Ninguna',
      condiciones_medicas: 'Ninguna',
      contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
    });

    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', cookie)
      .send({ email: studentEmail });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].materia).toBe('MateriaConNotas');
    expect(res.body.data[0].evaluaciones).toEqual([]);
  });

  it('debe devolver una nota de 0 como 0 y no como null, antes gradesMap.get() con || la colapsaba', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'MateriaConNotaCero' });
    await request
      .post('/api/gradeSections')
      .set('Cookie', cookie)
      .send({ grado: '9', seccion: 'Y', materias: ['MateriaConNotaCero'] });

    const studentEmail = 'est-nota-cero@test.com';
    await request.post('/api/students').set('Cookie', cookie).send({
      nombre: 'Luis',
      apellido: 'Estudiante',
      email: studentEmail,
      password: 'password123',
      rolNombre: 'student',
      fecha_nacimiento: '2011-01-01',
      genero: 'Masculino',
      domicilio: 'Casa 10',
      nacionalidad: 'Venezolana',
      email_padre: parentUser.email,
      grado: '9',
      seccion: 'Y',
      alergias: 'Ninguna',
      condiciones_medicas: 'Ninguna',
      contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
    });

    await request.post('/api/evaluations').set('Cookie', cookie).send({
      nombre: 'ExamenReprobado',
      nombreMateria: 'MateriaConNotaCero',
      grado: '9',
      seccion: 'Y',
      descripcion: 'Examen final',
      fecha: '2026-01-10',
      peso: 1.0,
    });

    await request.post('/api/evaluation_grades').set('Cookie', cookie).send({
      email: studentEmail,
      nombreMateria: 'MateriaConNotaCero',
      nombreEvaluacion: 'ExamenReprobado',
      calificacion: 0,
    });

    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', cookie)
      .send({ email: studentEmail });

    expect(res.status).toBe(200);
    expect(res.body.data[0].evaluaciones[0].nota).toBe(0);
  });
});

describe('POST /api/students/get-all, alcance del profesor', () => {
  const claseDelProfe = { grado: '7', seccion: 'P' };
  const claseAjena = { grado: '7', seccion: 'Q' };
  const profeEmail = 'profe-scope@test.com';
  const alumnoPropio = 'alumno-propio-scope@test.com';
  const alumnoAjeno = 'alumno-ajeno-scope@test.com';

  // El profesor dicta SOLO Algebra en 7P. En 7P también se dicta Biologia (que no es suya),
  // y en 7Q se dicta Algebra pero él no tiene esa clase asignada.
  beforeAll(async () => {
    const cookie = await loginAsAdmin();

    await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'Algebra' });
    await request.post('/api/subjects').set('Cookie', cookie).send({ nombre: 'Biologia' });
    for (const clase of [claseDelProfe, claseAjena]) {
      await request
        .post('/api/gradeSections')
        .set('Cookie', cookie)
        .send({ ...clase, materias: ['Algebra', 'Biologia'] });
    }

    await request.post('/api/teachers').set('Cookie', cookie).send({
      nombre: 'Carlos', apellido: 'Profesor', email: profeEmail, password: 'password123',
      fecha_nacimiento: '1985-07-07', rolNombre: 'teacher', genero: 'Masculino',
      domicilio: 'Casa Profe', nacionalidad: 'Venezolana',
      asignaciones: [{ materias: ['Algebra'], ...claseDelProfe }],
      telefono: '+50355556666', especialidad: 'Algebra',
    });

    for (const [email, clase] of [[alumnoPropio, claseDelProfe], [alumnoAjeno, claseAjena]]) {
      await request.post('/api/students').set('Cookie', cookie).send({
        ...buildStudent(email),
        grado: clase.grado,
        seccion: clase.seccion,
      });
    }
  });

  async function loginAsProfe() {
    const res = await request.post('/api/users/login').send({ email: profeEmail, password: 'password123' });
    const [cookie] = res.headers['set-cookie'];
    return cookie.split(';')[0];
  }

  it('el profesor solo ve las materias que dicta en la clase del alumno - 200', async () => {
    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', await loginAsProfe())
      .send({ email: alumnoPropio });

    expect(res.status).toBe(200);
    // Biologia también se dicta en 7P, pero no es suya
    expect(res.body.data.map((m) => m.materia)).toEqual(['Algebra']);
  });

  it('el profesor no puede ver el boletín de un alumno de una clase que no dicta - 403', async () => {
    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', await loginAsProfe())
      .send({ email: alumnoAjeno });

    expect(res.status).toBe(403);
  });

  it('el admin sigue viendo el boletín completo - 200', async () => {
    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', await loginAsAdmin())
      .send({ email: alumnoPropio });

    expect(res.status).toBe(200);
    expect(res.body.data.map((m) => m.materia).sort()).toEqual(['Algebra', 'Biologia']);
  });

  it('el propio alumno sigue viendo su boletín completo - 200', async () => {
    const loginRes = await request
      .post('/api/users/login')
      .send({ email: alumnoPropio, password: 'password123' });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request
      .post('/api/students/get-all')
      .set('Cookie', cookie.split(';')[0])
      .send({ email: alumnoPropio });

    expect(res.status).toBe(200);
    expect(res.body.data.map((m) => m.materia).sort()).toEqual(['Algebra', 'Biologia']);
  });
});
