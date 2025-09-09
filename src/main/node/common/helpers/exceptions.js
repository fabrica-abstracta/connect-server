class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409, 'CONFLICT');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos', errors = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}

const exceptions = {
  badRequest: (msg) => new AppError(msg || 'Solicitud incorrecta'),
  notFound: (msg) => new NotFoundError(msg || 'Recurso no encontrado'),
  conflict: (msg) => new ConflictError(msg || 'Conflicto con el estado actual del recurso'),
  validation: (msg, errors) => new ValidationError(msg || 'Datos de entrada inválidos', errors),
  unauthorized: (msg) => new UnauthorizedError(msg || 'No autorizado'),
  forbidden: (msg) => new ForbiddenError(msg || 'Acceso denegado'),
  general: (msg) => new AppError(msg || 'Error en la aplicación')
};

module.exports = exceptions;
