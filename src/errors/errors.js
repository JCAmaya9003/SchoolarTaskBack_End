// Clase base para errores personalizados con código de estado HTTP
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Errores operacionales vs bugs de programación
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - Bad Request
export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado. Token requerido') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Credenciales inválidas') {
    super(message, 401);
    this.name = 'InvalidCredentialsError';
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para esta acción') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(message = 'El usuario ya existe') {
    super(message);
    this.name = 'UserAlreadyExistsError';
  }
}