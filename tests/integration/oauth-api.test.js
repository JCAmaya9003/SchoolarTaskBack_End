import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB, registerUserDirectly } from '../setup.js';
import Role from '../../src/models/role-model.js';

const { mockGenerateAuthUrl, mockGetToken, mockVerifyIdToken } = vi.hoisted(() => ({
  mockGenerateAuthUrl: vi.fn(() => 'https://accounts.google.com/mock-auth-url'),
  mockGetToken: vi.fn(),
  mockVerifyIdToken: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(function () {
    return {
      generateAuthUrl: mockGenerateAuthUrl,
      getToken: mockGetToken,
      verifyIdToken: mockVerifyIdToken,
    };
  }),
}));

let app;
let request;

const existingUser = {
  nombre: 'Gustavo',
  apellido: 'Estudiante',
  email: 'gustavo-oauth@test.com',
  password: 'password123',
  rolNombre: 'student',
  fecha_nacimiento: '2010-01-01',
  genero: 'Masculino',
  domicilio: 'Casa 1',
  nacionalidad: 'Venezolana',
};

function mockGoogleResponds({ email, email_verified = true }) {
  mockGetToken.mockResolvedValue({ tokens: { id_token: 'fake-id-token' } });
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => ({ email, email_verified }),
  });
}

async function getStateCookie(request) {
  const res = await request.post('/oauth');
  const setCookie = res.headers['set-cookie'] || [];
  const stateCookie = setCookie.find((c) => c.startsWith('oauth_state='));
  return stateCookie.split(';')[0];
}

beforeAll(async () => {
  await setupTestDB();
  await Role.create({ nombre: 'student' });

  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);

  await registerUserDirectly(existingUser);
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(() => {
  mockGetToken.mockReset();
  mockVerifyIdToken.mockReset();
});

describe('POST /oauth', () => {
  it('debe generar la URL de autenticación y setear la cookie de state - 200', async () => {
    const res = await request.post('/oauth');

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBeDefined();
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some((c) => c.startsWith('oauth_state='))).toBe(true);
  });
});

describe('GET /oauth (callback)', () => {
  it('falla si falta el code - 400', async () => {
    const res = await request.get('/oauth').query({ state: 'cualquiera' });

    expect(res.status).toBe(400);
  });

  it('rechaza si falta el state - 400 (regresión: CSRF, antes no se validaba state)', async () => {
    mockGoogleResponds({ email: existingUser.email });

    const res = await request.get('/oauth').query({ code: 'algun-code' });

    expect(res.status).toBe(400);
  });

  it('rechaza si el state no coincide con la cookie - 400 (regresión: CSRF)', async () => {
    mockGoogleResponds({ email: existingUser.email });
    const stateCookie = await getStateCookie(request);

    const res = await request
      .get('/oauth')
      .set('Cookie', stateCookie)
      .query({ code: 'algun-code', state: 'state-falsificado-por-atacante' });

    expect(res.status).toBe(400);
  });

  it('rechaza si el email de Google no está verificado - 400 (regresión: email_verified nunca se chequeaba)', async () => {
    mockGoogleResponds({ email: existingUser.email, email_verified: false });
    const stateCookie = await getStateCookie(request);
    const res = await request.post('/oauth');
    const setCookie = res.headers['set-cookie'] || [];
    const validState = setCookie.find((c) => c.startsWith('oauth_state=')).split(';')[0].split('=')[1];

    const callbackRes = await request
      .get('/oauth')
      .set('Cookie', `oauth_state=${validState}`)
      .query({ code: 'algun-code', state: validState });

    expect(callbackRes.status).toBe(400);
  });

  it('falla si el usuario de Google no existe en la base local - 404', async () => {
    mockGoogleResponds({ email: 'no-existe-oauth@test.com' });
    const res = await request.post('/oauth');
    const setCookie = res.headers['set-cookie'] || [];
    const validState = setCookie.find((c) => c.startsWith('oauth_state=')).split(';')[0].split('=')[1];

    const callbackRes = await request
      .get('/oauth')
      .set('Cookie', `oauth_state=${validState}`)
      .query({ code: 'algun-code', state: validState });

    expect(callbackRes.status).toBe(404);
  });

  it('con state y email verificado válidos, autentica y redirige - 302', async () => {
    mockGoogleResponds({ email: existingUser.email });
    const res = await request.post('/oauth');
    const setCookie = res.headers['set-cookie'] || [];
    const validState = setCookie.find((c) => c.startsWith('oauth_state=')).split(';')[0].split('=')[1];

    const callbackRes = await request
      .get('/oauth')
      .set('Cookie', `oauth_state=${validState}`)
      .query({ code: 'algun-code', state: validState });

    expect(callbackRes.status).toBe(302);
    expect(callbackRes.headers.location).toContain('/googleload');
    const cookies = callbackRes.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.startsWith('token='))).toBe(true);
  });
});
