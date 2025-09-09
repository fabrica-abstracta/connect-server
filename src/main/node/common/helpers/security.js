const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { variables } = require('../config/env');

let joseModule = null;

const loadJose = async () => {
  if (!joseModule) {
    try {
      joseModule = await import('jose');
    } catch (error) {
      throw new Error(`Error al cargar el módulo JOSE: ${error.message}`);
    }
  }
  return joseModule;
};

const getSecretKey = () => {
  try {
    if (!variables.jwt.secret) throw new Error('JWT_SECRET no está disponible desde variables');
    return new TextEncoder().encode(variables.jwt.secret);
  } catch (error) {
    throw new Error(`Error generando clave secreta: ${error.message}`);
  }
};

const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  try {
    return await bcrypt.hash(password, variables.bcrypt.saltRounds);
  } catch (error) {
    throw new Error(`Error hashing password: ${error.message}`);
  }
};

const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
};

const parseExpirationTime = () => {
  const expiresIn = variables.jwt.expiresIn;
  const now = Math.floor(Date.now() / 1000);
  const timeMap = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
    'w': 604800
  };

  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);

  const [, amount, unit] = match;
  return now + (parseInt(amount) * timeMap[unit]);
};

const generateToken = async (payload) => {
  if (!payload || typeof payload !== 'object') throw new Error('Payload must be a valid object');

  try {
    const jose = await loadJose();
    const secret = getSecretKey();
    const expirationTime = parseExpirationTime();

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: variables.jwt.algorithm })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .setIssuer(variables.jwt.issuer)
      .setAudience(variables.jwt.audience)
      .setJti(crypto.randomUUID())
      .sign(secret);
  } catch (error) {
    throw new Error(`Error generating JWT token: ${error.message}`);
  }
};

const verifyToken = async (token) => {
  if (!token || typeof token !== 'string') throw new Error('Token must be a non-empty string');

  try {
    const jose = await loadJose();
    const secret = getSecretKey();

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: variables.jwt.issuer,
      audience: variables.jwt.audience
    });
    return payload;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateSecureToken,
  parseExpirationTime
};
