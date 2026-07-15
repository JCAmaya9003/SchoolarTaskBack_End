import { AppError } from '../errors/errors.js';
import logger from '../config/logger.js';

/**
 * Middleware global de manejo de errores
 * Debe ser el ÚLTIMO middleware en app.js
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;

  // Loggear error
  logger.error('Error capturado:', {
    name: err.name,
    message: err.message,
    statusCode: error.statusCode || 500,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Los errores ya tipados (AppError y subclases) ya traen su statusCode correcto;
  // solo hace falta traducir errores "crudos" de librerías externas (Mongoose, JWT, express-validator).
  if (!(err instanceof AppError)) {
    // Error de validación de Mongoose
    if (err.name === 'ValidationError' && err.errors) {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      error = new AppError(message, 400);
    }

    // Error de ObjectId inválido de Mongoose
    if (err.name === 'CastError') {
      const message = `Recurso no encontrado. ID inválido: ${err.value}`;
      error = new AppError(message, 404);
    }

    // Error de clave duplicada de MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      const message = `Ya existe un registro con ${field}: ${value}`;
      error = new AppError(message, 409);
    }

    // Error de JWT inválido
    if (err.name === 'JsonWebTokenError') {
      const message = 'Token inválido. Por favor, inicia sesión de nuevo';
      error = new AppError(message, 401);
    }

    // Error de JWT expirado
    if (err.name === 'TokenExpiredError') {
      const message = 'Token expirado. Por favor, inicia sesión de nuevo';
      error = new AppError(message, 401);
    }

    // Error de express-validator
    if (err.array && typeof err.array === 'function') {
      const message = err.array().map(e => e.msg).join(', ');
      error = new AppError(message, 400);
    }
  }

  // Respuesta de error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware para manejar rutas no encontradas (404)
 * Debe ir ANTES del errorHandler en app.js
 */
export const notFound = (req, res, next) => {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};
