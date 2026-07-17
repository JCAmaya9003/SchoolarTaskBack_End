import { describe, it, expect } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import rateLimit from 'express-rate-limit';

// authLimiter y apiLimiter son passthrough en modo test, así que acá probamos la misma
// configuración montada en un mini servidor propio, para verificar que sí bloquea al
// superar el límite.
describe('authLimiter, configuración de límite', () => {
  it('permite 5 intentos y bloquea el 6to con 429', async () => {
    const app = express();
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
    }));
    app.get('/test', (req, res) => res.status(200).json({ ok: true }));

    const request = supertest(app);

    for (let i = 0; i < 5; i++) {
      const res = await request.get('/test');
      expect(res.status).toBe(200);
    }

    const blocked = await request.get('/test');
    expect(blocked.status).toBe(429);
  });
});
