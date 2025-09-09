const Joi = require('joi');

const baseSchemas = {
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    "string.pattern.base": "El id no es válido, debe ser un ObjectId de Mongo",
  }),
  name: Joi.string()
    .trim()
    .min(1)
    .max(32)
    .messages({
      "string.empty": "El nombre no puede estar vacío",
      "string.min": "El nombre debe tener al menos 1 caracter",
      "string.max": "El nombre no debe superar los 32 caracteres",
      "string.pattern.base": "El nombre contiene caracteres inválidos",
    }),
  description: Joi.string()
    .trim()
    .max(64)
    .messages({
      "string.max": "La descripción no debe superar los 64 caracteres",
      "string.pattern.base": "La descripción contiene caracteres inválidos",
    }),
  isVisible: Joi.boolean().messages({
    "boolean.base": "El campo isVisible debe ser verdadero o falso",
  }),
  pagination: {
    page: Joi.number()
      .integer()
      .min(1)
      .messages({
        "number.base": "El campo page debe ser un número",
        "number.min": "El campo page debe ser mayor o igual a 1",
        "number.integer": "El campo page debe ser un número entero",
      }),

    perPage: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .messages({
        "number.base": "El campo perPage debe ser un número",
        "number.min": "El campo perPage debe ser mayor o igual a 1",
        "number.max": "El campo perPage no puede ser mayor a 30",
        "number.integer": "El campo perPage debe ser un número entero",
      }),
  },
};

module.exports = baseSchemas;