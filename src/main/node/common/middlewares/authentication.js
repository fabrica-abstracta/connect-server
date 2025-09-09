const exceptions = require('../helpers/exceptions');
const { verifyToken } = require('../helpers/security');
const accountSessions = require('../../authentication/schemas/accountSessions');
const logger = require('../config/logger');

module.exports = async (req, res, next) => {
  try {
    if (!req.cookies) {
      logger.warn('No cookies available - cookie parser not configured');
      throw exceptions.unauthorized("No cookies available - cookie parser not configured");
    }

    const token = req.cookies.accessToken;
    if (!token) {
      logger.warn('No token provided');
      throw exceptions.unauthorized("No token provided");
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch (err) {
      logger.warn('Invalid token: ' + err.message);
      throw exceptions.unauthorized("Invalid token: " + err.message);
    }

    if (!payload.session) {
      logger.warn('Token sin session payload');
      throw exceptions.unauthorized("Token sin session payload");
    }

    const session = await accountSessions.findById(payload.session);
    if (!session) {
      logger.warn(`Sesión no encontrada para sessionId: ${payload.session}`);
      throw exceptions.unauthorized("Sesión no encontrada");
    }

    if (session.status !== 'active') {
      logger.warn(`Sesión no activa. Estado actual: ${session.status}`);
      throw exceptions.unauthorized("Sesión cerrada o inválida");
    }

    req.account = payload;
    next();
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};
