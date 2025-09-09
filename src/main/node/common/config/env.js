const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'DEFAULT_PAGE_LIMIT',
  'MAX_PAGE_LIMIT',
  'LOG_LEVEL',
  'CORS_ORIGIN',
  'CORS_CREDENTIALS',
  'SESSION_TIMEOUT',
  'FRONTEND_URL',
  'PRETTY_LOGS',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_SECURE',
  'EMAIL_TLS_REJECT_UNAUTHORIZED',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
  'EMAIL_RECOVER_APP',
  'EMAIL_RECOVER_SUBJECT',
  'EMAIL_RECOVER_HTML',
  'EXPRESS_JSON_LIMIT',
  'EXPRESS_URLENCODED_LIMIT',
  'LOG_OBFUSCATION_ENABLED',
  'LOG_OBFUSCATED_FIELDS',
  'LOG_PARTIALLY_OBFUSCATED_FIELDS',
  'LOG_FULLY_OBFUSCATED_FIELDS'
];

const validateEnv = () => {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    const errorMessage = `VARIABLES DE ENTORNO FALTANTES: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

const variables = {
  recover: {
    timeoutMinutes: parseInt(process.env.RECOVER_TIMEOUT_MINUTES),
  },
  server: {
    port: parseInt(process.env.PORT),
    env: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT)
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    algorithm: 'HS256',
    issuer: 'connect-api',
    audience: 'connect-client'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  },
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT),
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT)
  },
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS)
  },
  email: {
    frontendUrl: process.env.FRONTEND_URL,
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    tlsRejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    recoverApp: process.env.EMAIL_RECOVER_APP,
    recoverSubject: process.env.EMAIL_RECOVER_SUBJECT,
    recoverHtml: process.env.EMAIL_RECOVER_HTML
  },
  express: {
    jsonLimit: process.env.EXPRESS_JSON_LIMIT,
    urlencodedLimit: process.env.EXPRESS_URLENCODED_LIMIT
  }
};

module.exports = { variables, validateEnv };

