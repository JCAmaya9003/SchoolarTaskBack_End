import { describe, it, expect } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { errorHandler } from '../../src/middlewares/error-middleware.js';
import { NotFoundError, ValidationError } from '../../src/errors/errors.js';

// Mini-app que solo ejerce el errorHandler: cada ruta tira un error distinto.
function buildApp() {
  const app = express();

  app.get('/bug', () => {
    // Un bug inesperado: no es un AppError, su mensaje es crudo
    const cliente = null;
    return cliente.datos.secreto; // TypeError: Cannot read properties of null
  });

  app.get('/operacional', () => {
    throw new NotFoundError('El estudiante con id 42 no existe');
  });

  app.get('/validacion', () => {
    throw new ValidationError('La fecha de fin debe ser posterior a la de inicio');
  });

  app.use(errorHandler);
  return supertest(app);
}

describe('errorHandler, fuga del mensaje interno', () => {
  const request = buildApp();

  it('un bug inesperado responde 500 con un mensaje genérico, sin exponer el interno', async () => {
    const res = await request.get('/bug');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error interno del servidor');
    // El texto crudo del TypeError no viaja al cliente
    expect(res.body.message).not.toContain('Cannot read properties');
    expect(res.body.stack).toBeUndefined();
  });

  it('un error operacional sí muestra su mensaje, es información útil para el cliente', async () => {
    const res = await request.get('/operacional');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('El estudiante con id 42 no existe');
  });

  it('un ValidationError conserva su mensaje y su 400', async () => {
    const res = await request.get('/validacion');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('posterior');
  });
});
