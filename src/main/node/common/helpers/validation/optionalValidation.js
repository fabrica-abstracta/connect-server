const baseSchemas = require('./baseSchemas');

const optionalSchemas = {
  objectId: baseSchemas.objectId,
  name: baseSchemas.name,
  description: baseSchemas.description,
  isVisible: baseSchemas.isVisible,
  pagination: baseSchemas.pagination,
};

module.exports = optionalSchemas;