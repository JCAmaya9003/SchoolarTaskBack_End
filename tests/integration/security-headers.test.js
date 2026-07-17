import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestDB, teardownTestDB } from '../setup.js';

let app;
let request;

beforeAll(async () => {
  await setupTestDB();
  const appModule = await import('../../app.js');
  app = appModule.default;
  request = supertest(app);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('Headers de seguridad, helmet', () => {
  it('no debe exponer el header X-Powered-By, antes revelaba que el backend usa Express', async () => {
    const res = await request.get('/api/subjects');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('debe incluir headers de seguridad estándar', async () => {
    const res = await request.get('/api/subjects');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('la documentación de Swagger sigue funcionando, CSP desactivada a propósito para no romperla', async () => {
    const res = await request.get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toBeUndefined();
  });
});
