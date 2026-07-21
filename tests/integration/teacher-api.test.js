import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

let app;
let request;

const adminUser = {
  nombre: 'Admin',
  apellido: 'Admin',
  email: 'admin-teacher@test.com',
  password: 'admin123456',
  fecha_nacimiento: '1990-01-01',
  rolNombre: 'admin',
  genero: 'Masculino',
  domicilio: 'Admin St 1',
  nacionalidad: 'Venezolana',
};

const gradeSectionData = { grado: '2', seccion: 'B', materias: ['Matematicas'] };

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
  asignaciones: [
    {
      grado: gradeSectionData.grado,
      seccion: gradeSectionData.seccion,
      materias: ['Matematicas'],
    },
  ],
  telefono: '+50312345678',
  especialidad: 'Álgebra',
});

async function loginAsAdmin() {
  const res = await request.post('/api/users/login').send({
    email: adminUser.email,
    password: adminUser.password,
  });
  const [cookie] = res.headers['set-cookie'];
  return cookie.split(';')[0];
}

// Necesario para matricular alumnos en las pruebas del reporte
const parentUser = {
  nombre: 'Pedro',
  apellido: 'Padre',
  email: 'padre-teacher@test.com',
  password: 'password123',
  rolNombre: 'parent',
  fecha_nacimiento: '1980-03-03',
  genero: 'Masculino',
  domicilio: 'Casa del padre',
  nacionalidad: 'Venezolana',
  telefono: '+50399990000',
  telefono_trabajo: '+50399991111',
  lugar_trabajo: 'Oficina',
  profesion: 'Ingeniero',
};

beforeAll(async () => {
  await setupTestDB();
  await Role.create({ nombre: 'admin' });
  await Role.create({ nombre: 'teacher' });
  await Role.create({ nombre: 'student' });
  await Role.create({ nombre: 'parent' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(adminUser);
  const adminCookie = await loginAsAdmin();

  await request.post('/api/subjects').set('Cookie', adminCookie).send({ nombre: 'Matematicas' });
  await request.post('/api/gradeSections').set('Cookie', adminCookie).send(gradeSectionData);
  await request.post('/api/parents').set('Cookie', adminCookie).send(parentUser);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/teachers, admin', () => {
  it('debe crear un profesor - 201', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/teachers')
      .set('Cookie', cookie)
      .send(buildTeacher('prof1@test.com'));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Profesor creado con éxito');
    expect(res.body.data.email).toBe('prof1@test.com');
    expect(res.body.data.id).toBeDefined();
  });

  it('rechaza HTML/scripts en campos de texto libre, especialidad - 400, defensa XSS', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .post('/api/teachers')
      .set('Cookie', cookie)
      .send({ ...buildTeacher('prof-xss@test.com'), especialidad: '<script>alert(document.cookie)</script>' });

    expect(res.status).toBe(400);
  });

  it('debe fallar si la materia no existe - 404', async () => {
    const cookie = await loginAsAdmin();
    const payload = buildTeacher('prof2@test.com');
    payload.asignaciones[0].materias = ['MateriaFantasma'];

    const res = await request.post('/api/teachers').set('Cookie', cookie).send(payload);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/teachers, admin', () => {
  it('debe listar profesores paginados - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof3@test.com'));

    const res = await request.get('/api/teachers').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });

  it('debe incluir genero, domicilio, nacionalidad y rol en el listado - 200, antes findAllTeachers no los populaba', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof-populate@test.com'));

    const res = await request.get('/api/teachers').set('Cookie', cookie);

    const teacher = res.body.data.items.find((t) => t.email === 'prof-populate@test.com');
    expect(teacher.genero).toBe('Femenino');
    expect(teacher.domicilio).toBe('Casa 2');
    expect(teacher.nacionalidad).toBe('Venezolana');
    expect(teacher.rol).toBeDefined();
  });
});

describe('POST /api/users/get-info, teacher', () => {
  it('debe devolver grado_encargado con las materias del profesor - 200, antes leía campos que no existían en el modelo', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof-getinfo@test.com'));

    const res = await request
      .post('/api/users/get-info')
      .set('Cookie', cookie)
      .send({ email: 'prof-getinfo@test.com', rolNombre: 'teacher' });

    expect(res.status).toBe(200);
    expect(res.body.data.direccion).toBeUndefined();
    expect(res.body.data.materias).toBeUndefined();
    expect(res.body.data.grados_secciones).toBeUndefined();
    expect(Array.isArray(res.body.data.grado_encargado)).toBe(true);
    expect(res.body.data.grado_encargado[0].materias.length).toBeGreaterThan(0);
  });
});

describe('PUT /api/teachers, admin', () => {
  it('debe actualizar un profesor - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof4@test.com'));

    const res = await request
      .put('/api/teachers')
      .set('Cookie', cookie)
      .send({
        email: 'prof4@test.com',
        asignaciones: [
          {
            grado: gradeSectionData.grado,
            seccion: gradeSectionData.seccion,
            materias: ['Matematicas'],
          },
        ],
        telefono: '+50387654321',
        especialidad: 'Geometría',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.especialidad).toBe('Geometría');
  });

  it('debe fallar si el profesor no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .put('/api/teachers')
      .set('Cookie', cookie)
      .send({
        email: 'noexiste-prof@test.com',
        asignaciones: [
          {
            grado: gradeSectionData.grado,
            seccion: gradeSectionData.seccion,
            materias: ['Matematicas'],
          },
        ],
        telefono: '+50387654321',
        especialidad: 'Geometría',
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/teachers, admin', () => {
  it('debe eliminar un profesor por email - 200', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof5@test.com'));

    const res = await request
      .delete('/api/teachers')
      .set('Cookie', cookie)
      .send({ email: 'prof5@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('prof5@test.com');
  });

  it('debe fallar si el profesor no existe - 404', async () => {
    const cookie = await loginAsAdmin();

    const res = await request
      .delete('/api/teachers')
      .set('Cookie', cookie)
      .send({ email: 'noexiste-prof2@test.com' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/teachers, borrado por email', () => {
  it('ya no existe la ruta por id, que borraba el perfil sin desactivar el usuario - 404', async () => {
    const cookie = await loginAsAdmin();
    const createRes = await request
      .post('/api/teachers')
      .set('Cookie', cookie)
      .send(buildTeacher('prof6@test.com'));

    const res = await request
      .delete('/api/teachers/id')
      .set('Cookie', cookie)
      .send({ id: createRes.body.data.id });

    expect(res.status).toBe(404);
  });

  it('borrar por email deja el usuario desactivado, no puede volver a entrar - regresión', async () => {
    const cookie = await loginAsAdmin();
    await request.post('/api/teachers').set('Cookie', cookie).send(buildTeacher('prof-baja@test.com'));

    // Entra bien antes de la baja
    const antes = await request
      .post('/api/users/login')
      .send({ email: 'prof-baja@test.com', password: 'password123' });
    expect(antes.status).toBe(200);

    const baja = await request
      .delete('/api/teachers')
      .set('Cookie', cookie)
      .send({ email: 'prof-baja@test.com' });
    expect(baja.status).toBe(200);

    // Tras la baja el usuario queda desactivado: no queda un usuario fantasma con rol teacher
    const despues = await request
      .post('/api/users/login')
      .send({ email: 'prof-baja@test.com', password: 'password123' });
    expect(despues.status).toBe(401);
  });
});

describe('GET /api/teachers/get-teacherInfo', () => {
  it('un profesor puede ver la info de sus propias materias - 200', async () => {
    await request.post('/api/teachers').set('Cookie', await loginAsAdmin()).send(buildTeacher('prof7@test.com'));

    const loginRes = await request.post('/api/users/login').send({
      email: 'prof7@test.com',
      password: 'password123',
    });
    const [cookie] = loginRes.headers['set-cookie'];

    const res = await request.get('/api/teachers/get-teacherInfo').set('Cookie', cookie.split(';')[0]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('debe rechazar sin autenticación - 401', async () => {
    const res = await request.get('/api/teachers/get-teacherInfo');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/teachers/get-teacherInfo, alcance por clase', () => {
  // Matematicas se dicta en 8A y en 8B. El profesor SOLO la dicta en 8A.
  const PROFE = 'profe-reporte@test.com';
  const ALUMNO_PROPIO = 'alumno-8a-reporte@test.com';
  const ALUMNO_AJENO = 'alumno-8b-reporte@test.com';

  beforeAll(async () => {
    const cookie = await loginAsAdmin();
    const post = (url, body) => request.post(url).set('Cookie', cookie).send(body);

    await post('/api/subjects', { nombre: 'MateReporte' });
    await post('/api/gradeSections', { grado: '8', seccion: 'A', materias: ['MateReporte'] });
    await post('/api/gradeSections', { grado: '8', seccion: 'B', materias: ['MateReporte'] });

    await post('/api/teachers', {
      ...buildTeacher(PROFE),
      asignaciones: [{ materias: ['MateReporte'], grado: '8', seccion: 'A' }],
    });

    for (const [email, seccion] of [[ALUMNO_PROPIO, 'A'], [ALUMNO_AJENO, 'B']]) {
      await post('/api/students', {
        nombre: 'Alumno', apellido: 'Reporte', email, password: 'password123',
        rolNombre: 'student', fecha_nacimiento: '2010-05-05', genero: 'Masculino',
        domicilio: 'Casa', nacionalidad: 'Venezolana', email_padre: parentUser.email,
        grado: '8', seccion,
        alergias: 'Ninguna', condiciones_medicas: 'Ninguna',
        contacto_emergencia: { nombre: 'Pedro Padre', telefono: '+50312345678' },
      });
    }

    await post('/api/evaluations', {
      nombre: 'Parcial 8A', nombreMateria: 'MateReporte', grado: '8', seccion: 'A',
      descripcion: 'x', fecha: '2026-03-01', peso: 25,
    });
    await post('/api/evaluations', {
      nombre: 'Parcial 8B', nombreMateria: 'MateReporte', grado: '8', seccion: 'B',
      descripcion: 'x', fecha: '2026-03-02', peso: 25,
    });
    await post('/api/evaluation_grades', {
      email: ALUMNO_PROPIO, nombreMateria: 'MateReporte', nombreEvaluacion: 'Parcial 8A', calificacion: 7,
    });
    await post('/api/evaluation_grades', {
      email: ALUMNO_AJENO, nombreMateria: 'MateReporte', nombreEvaluacion: 'Parcial 8B', calificacion: 9,
    });
  });

  async function reporteDelProfe() {
    const loginRes = await request.post('/api/users/login').send({ email: PROFE, password: 'password123' });
    const [cookie] = loginRes.headers['set-cookie'];
    return request.get('/api/teachers/get-teacherInfo').set('Cookie', cookie.split(';')[0]);
  }

  it('la entrada identifica la clase, no solo la materia - 200', async () => {
    const res = await reporteDelProfe();

    expect(res.status).toBe(200);
    const entrada = res.body.data.find((e) => e.materia === 'MateReporte');
    expect(entrada.grado).toBe('8');
    expect(entrada.seccion).toBe('A');
  });

  it('no incluye alumnos de una clase que no dicta - regresión de fuga de notas', async () => {
    const res = await reporteDelProfe();

    const entrada = res.body.data.find((e) => e.materia === 'MateReporte');
    const emails = entrada.estudiantes.map((e) => e.estudiante.email);

    expect(emails).toContain(ALUMNO_PROPIO);
    expect(emails).not.toContain(ALUMNO_AJENO);
  });

  it('solo cruza a cada alumno con las evaluaciones de SU clase', async () => {
    const res = await reporteDelProfe();

    const entrada = res.body.data.find((e) => e.materia === 'MateReporte');
    const alumno = entrada.estudiantes.find((e) => e.estudiante.email === ALUMNO_PROPIO);

    // Antes aparecía también "Parcial 8B" con nota null, una evaluación de otra clase
    expect(alumno.evaluaciones).toHaveLength(1);
    expect(alumno.evaluaciones[0].evaluacion).toBe('Parcial 8A');
    expect(alumno.evaluaciones[0].nota).toBe(7);
  });
});
