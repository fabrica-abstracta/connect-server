const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const env = require('./common/config/env');
env.validateEnv();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { variables: config } = require('./common/config/env');
global.logger = require('./common/config/logger');
const { errorHandler } = require('./common/middlewares/errorHandler');
const app = express();
const limiter = rateLimit(config.rateLimit);
const { getSectors, getPlans, getUnitsOfMeasure, getFeatures, getModules } = require('./common/config/data');
const authentication = require('./common/middlewares/authentication');

app.use(helmet());
app.use(compression());
app.use(cors(config.cors));
app.use(limiter);
app.use(cookieParser());
app.use(express.json({ limit: config.express.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: config.express.urlencodedLimit }));

app.use('/', require('./authentication/index'));
app.use('/', require('./file/index'));
app.use('/', authentication, require('./account/index'));
app.use('/', authentication, require('./store/index'));
app.use('/', authentication, require('./manual/index'));
app.use('/', authentication, require('./saas/index'));
app.use('/', authentication, require('./inventory/index'));

app.use((req, res, next) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('Iniciando servidor...');
    logger.info('Cargando datos YAML...');
    const sectores = getSectors();
    const planes = getPlans();
    const features = getFeatures();
    const modules = getModules();
    const unidades = getUnitsOfMeasure();
    if (!sectores || !planes || !features || !modules || !unidades) {
      logger.error('No se pudieron cargar los datos YAML requeridos. El servidor no se iniciará.');
      process.exit(1);
    }
    logger.info('Datos YAML cargados correctamente.');

    logger.info('Conectando a la base de datos...');
    const connectDB = require('./common/config/database');
    await connectDB();
    logger.info('Base de datos conectada correctamente.');

    logger.info('Iniciando servidor Express...');
    const server = app.listen(config.server.port, () => {
      const os = require('os');
      const ifaces = os.networkInterfaces();
      let localUrl = `http://localhost:${config.server.port}`;
      let externalUrl = null;
      for (const name of Object.keys(ifaces)) {
        for (const iface of ifaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            externalUrl = `http://${iface.address}:${config.server.port}`;
            break;
          }
        }
        if (externalUrl) break;
      }
      const appName = 'connect-server';
      const profile = config.server.env;
      const separator = '-'.repeat(56);
      logger.info(`${separator}`);
      logger.info(`Application ${appName} is running! Access URLs:`);
      logger.info(`Local:      ${localUrl}`);
      if (externalUrl) logger.info(`External:   ${externalUrl}`);
      logger.info(`Profile:    ${profile}`);
      logger.info(`${separator}`);
    });

    const gracefulShutdown = (signal) => {
      logger.info(`Apagando servidor por señal ${signal}`);
      server.close(() => {
        logger.info('Servidor cerrado correctamente.');
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error(`Error al iniciar el servidor: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    process.exit(1);
  }
};

startServer();

module.exports = app;
