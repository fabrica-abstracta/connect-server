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

class BadRequestError extends AppError {
  constructor(message = 'Solicitud incorrecta') {
    super(message, 400, 'BAD_REQUEST');
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

class InternalServerError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Servicio no disponible') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

class GatewayTimeoutError extends AppError {
  constructor(message = 'Tiempo de espera agotado en el servidor') {
    super(message, 504, 'GATEWAY_TIMEOUT');
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Demasiadas solicitudes, intente más tarde') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

const exceptions = {
  badRequest: (msg) => new BadRequestError(msg || 'Solicitud incorrecta'),
  notFound: (msg) => new NotFoundError(msg || 'Recurso no encontrado'),
  conflict: (msg) => new ConflictError(msg || 'Conflicto con el estado actual del recurso'),
  validation: (msg, errors) => new ValidationError(msg || 'Datos de entrada inválidos', errors),
  unauthorized: (msg) => new UnauthorizedError(msg || 'No autorizado'),
  forbidden: (msg) => new ForbiddenError(msg || 'Acceso denegado'),
  internal: (msg) => new InternalServerError(msg || 'Error interno del servidor'),
  unavailable: (msg) => new ServiceUnavailableError(msg || 'Servicio no disponible'),
  timeout: (msg) => new GatewayTimeoutError(msg || 'Tiempo de espera agotado en el servidor'),
  tooMany: (msg) => new TooManyRequestsError(msg || 'Demasiadas solicitudes, intente más tarde'),
  general: (msg) => new AppError(msg || 'Error en la aplicación')
};

module.exports = exceptions;
