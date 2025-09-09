const { generateUniqueCode } = require("../helpers/helpers");

const errorHandler = (err, req, res, next) => {
  if (err && err.isOperational && err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {})
    });
  }

  if (err && err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    return res.status(400).json({
      message: 'Datos de entrada inválidos',
      errors
    });
  }

  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const fieldNames = {
      document: 'Documento',
      email: 'Correo electrónico',
      phone: 'Teléfono',
    };
    const friendlyField = fieldNames[field] || field;
    return res.status(409).json({
      message: `Ya existe un registro con ${friendlyField}: ${value}`,
    });
  }

  res.status(500).json({
    code: generateUniqueCode(),
    message: 'Oops, ocurrió algo inesperado',
    detail: err.message,
    ...(err.stack ? { stack: err.stack.split('\n')[1]?.trim() } : {})
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
