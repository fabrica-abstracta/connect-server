const pino = require('pino');


const loggerConfig = {
  level: process.env.LOG_LEVEL,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    bindings: () => ({}), // Elimina pid y hostname
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};


const logger = pino(loggerConfig);

// Sobrescribir info y error para aceptar string directo
const wrapMsg = (fn) => (msg, ...args) => {
  if (typeof msg === 'string') {
    return fn.call(logger, { msg }, ...args);
  }
  return fn.call(logger, msg, ...args);
};

logger.info = wrapMsg(logger.info);
logger.error = wrapMsg(logger.error);

module.exports = logger;
