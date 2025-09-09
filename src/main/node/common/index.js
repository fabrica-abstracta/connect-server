// ==== CONFIG ====
const { variables, validateEnv } = require('./config/env');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const emailConfig = require('./config/email');
const dataConfig = require('./config/data');

// ==== MIDDLEWARES ====
const authenticationMiddleware = require('./middlewares/authentication');
const errorHandler = require('./middlewares/errorHandler');
const { validateBody, validateParams, validateQuery } = require('./middlewares/validation');

// ==== HELPERS ====
const exceptions = require('./helpers/exceptions');
const { resolveActor } = require('./helpers/security/resolveActor');
const security = require('./helpers/security/security');
const generateUniqueCode = require('./helpers/security/uniqueCode');
const formatDate = require('./helpers/format/date');
const getLabelAndColor = require('./helpers/format/label');
const baseSchemas = require('./helpers/validation/baseSchemas');
const requiredValidation = require('./helpers/validation/requiredValidation');
const optionalValidation = require('./helpers/validation/optionalValidation');
const sendRecoveryEmail = require('./helpers/email/sendRecoveryEmail');

// ==== SCHEMAS ====
const UserRefSchema = require('./schemas/userRef.schema');

// ==== MAIN EXPORTS ====
module.exports = {
  // Config
  config: {
    variables,
    validateEnv,
    connectDB,
    logger,
    emailConfig,
    dataConfig
  },
  
  // Middlewares
  middlewares: {
    authentication: authenticationMiddleware,
    errorHandler,
    validateBody,
    validateParams,
    validateQuery
  },
  
  // Helpers
  helpers: {
    exceptions,
    resolveActor,
    security,
    generateUniqueCode,
    formatDate,
    getLabelAndColor,
    sendRecoveryEmail,
    validation: {
      baseSchemas,
      requiredValidation,
      optionalValidation
    }
  },
  
  // Schemas
  schemas: {
    UserRefSchema
  },
  
  // Direct exports (for backward compatibility and convenience)
  variables,
  validateEnv,
  connectDB,
  logger,
  exceptions,
  resolveActor,
  formatDate,
  getLabelAndColor,
  generateUniqueCode,
  validateBody,
  validateParams,
  validateQuery,
  errorHandler,
  authentication: authenticationMiddleware,
  UserRefSchema,
  baseSchemas,
  requiredSchemas: requiredValidation,
  optionalSchemas: optionalValidation
};