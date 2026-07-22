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

  // "Operacional" = un error esperado, con un mensaje pensado para el cliente (un AppError, o
  // un error de librería que traducimos abajo). Cualquier otra cosa es un bug inesperado: su
  // mensaje es crudo (ej. el texto de V8 de un TypeError) y no debe llegar al cliente.
  let isOperational = err instanceof AppError;

  // Los errores ya tipados como AppError ya traen su statusCode correcto.
  // Solo hace falta traducir errores crudos de librerías externas.
  if (!(err instanceof AppError)) {
    // Error de validación de Mongoose
    if (err.name === 'ValidationError' && err.errors) {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      error = new AppError(message, 400);
      isOperational = true;
    }

    // Error de ObjectId inválido de Mongoose
    if (err.name === 'CastError') {
      const message = `Recurso no encontrado. ID inválido: ${err.value}`;
      error = new AppError(message, 404);
      isOperational = true;
    }

    // Error de clave duplicada de MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      const message = `Ya existe un registro con ${field}: ${value}`;
      error = new AppError(message, 409);
      isOperational = true;
    }

    // Error de JWT inválido
    if (err.name === 'JsonWebTokenError') {
      const message = 'Token inválido. Por favor, inicia sesión de nuevo';
      error = new AppError(message, 401);
      isOperational = true;
    }

    // Error de JWT expirado
    if (err.name === 'TokenExpiredError') {
      const message = 'Token expirado. Por favor, inicia sesión de nuevo';
      error = new AppError(message, 401);
      isOperational = true;
    }

    // Error de express-validator
    if (err.array && typeof err.array === 'function') {
      const message = err.array().map(e => e.msg).join(', ');
      error = new AppError(message, 400);
      isOperational = true;
    }
  }

  // Respuesta de error
  const statusCode = error.statusCode || 500;
  // Un bug inesperado nunca expone su mensaje crudo al cliente (salvo en development, para
  // depurar): se responde un genérico. Los errores operacionales sí muestran su mensaje.
  const message = (isOperational || process.env.NODE_ENV === 'development')
    ? (error.message || 'Error interno del servidor')
    : 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    // El borrado de catálogos en dos pasos adjunta el detalle de lo que se destruiría, para que
    // el cliente pueda mostrarlo en el diálogo de confirmación antes de reintentar.
    ...(err.impacto && { impacto: err.impacto }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware para manejar rutas no encontradas, responde 404
 * Debe ir ANTES del errorHandler en app.js
 */
export const notFound = (req, res, next) => {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};
