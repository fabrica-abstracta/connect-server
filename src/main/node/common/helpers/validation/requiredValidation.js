const baseSchemas = require('./baseSchemas');

const requiredSchemas = {
  objectId: baseSchemas.objectId.required().messages({ "any.required": "El id es obligatorio" }),
  name: baseSchemas.name.required().messages({ "any.required": "El nombre es obligatorio" }),
  description: baseSchemas.description.required().messages({ "any.required": "La descripción es obligatoria" }),
  isVisible: baseSchemas.isVisible.required().messages({ "any.required": "El campo isVisible es obligatorio" }),
  pagination: {
    page: baseSchemas.pagination.page.required().messages({ "any.required": "El campo page es obligatorio" }),
    perPage: baseSchemas.pagination.perPage.required().messages({ "any.required": "El campo perPage es obligatorio" }),
  },
};

module.exports = requiredSchemas;