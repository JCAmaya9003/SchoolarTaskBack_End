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

  // Errores crudos de librerías que el handler traduce a un AppError equivalente
  app.get('/cast', () => {
    const err = new Error('Cast failed');
    err.name = 'CastError';
    err.value = 'no-es-un-id';
    throw err;
  });

  app.get('/duplicado', () => {
    const err = new Error('E11000 duplicate key');
    err.code = 11000;
    err.keyValue = { email: 'repetido@test.com' };
    throw err;
  });

  app.get('/token-expirado', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    throw err;
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

describe('errorHandler, traducción de errores de librerías', () => {
  const request = buildApp();

  it('un CastError de Mongoose se traduce a 404 con mensaje propio', async () => {
    const res = await request.get('/cast');

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('ID inválido');
    expect(res.body.message).not.toContain('Cast failed');
  });

  it('una clave duplicada de Mongo se traduce a 409 nombrando el campo', async () => {
    const res = await request.get('/duplicado');

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('email');
    expect(res.body.message).toContain('repetido@test.com');
  });

  it('un token expirado se traduce a 401', async () => {
    const res = await request.get('/token-expirado');

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('expirado');
  });
});
