const express = require('express');
const Joi = require('joi');
const { hashPassword, generateToken, parseExpirationTime, comparePassword, verifyToken } = require('../../common/helpers/security/security');
const { getSector, getSectorTerminology, getPlans } = require('../../common/config/data');
const { v4: uuidv4 } = require("uuid");

const planCodes = require('../schemas/planCodes');
const accounts = require('../schemas/accounts');
const accountProfiles = require('../schemas/accountProfiles');
const accountSessions = require('../schemas/accountSessions');
const stores = require('../schemas/stores');
const accountSubscriptions = require('../schemas/accountSubscriptions');

const { variables } = require('../../common/config/env');
const { validateBody, validateParams } = require('../../common/middlewares/validation');
const formatDate = require('../../common/helpers/format/date');
const exceptions = require('../../common/helpers/exceptions');
const authentication = require('../../common/middlewares/authentication');
const sendRecoveryEmail = require('../../common/helpers/email/sendRecoveryEmail');
const accountRecoveries = require('../schemas/accountRecoveries');
const router = express.Router();

router.post("/sign-up", validateBody(Joi.object({
  document: Joi.string()
    .pattern(/^[0-9]{8,12}$/)
    .required(),
  names: Joi.string()
    .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/)
    .min(2)
    .max(32)
    .required(),
  email: Joi.string().pattern(/^[A-Za-z0-9@._+-]{5,64}$/).required(),
  password: Joi.string().alphanum().min(8).max(22).required(),
  sector: Joi.string().max(22).default('restaurant').optional(),
  plan: Joi.string().valid('basic', 'professional', 'enterprise').default('basic').optional(),
  code: Joi.string().length(6).alphanum().optional()
})), async (req, res, next) => {
  let { document, names, email, password, sector, plan, code } = req.body;
  let planToUse, sectorToUse, terminology, newAccount, newStore, newSubscription, newSession;

  const hashedPassword = await hashPassword(password, 10);

  try {
    logger.info('Creando cuenta principal')
    newAccount = await accounts.create({
      document,
      names,
      email,
      password: hashedPassword
    });
    logger.info(`Cuenta creada: ${newAccount._id}`);

    logger.info('Creando perfil asociado')
    const profile = await accountProfiles.create({
      account: newAccount._id
    });
    logger.info(`Perfil creado: ${profile._id}`);

    logger.info(`Validando sector: ${sector}`);
    sectorToUse = getSector(sector);
    logger.info(`Sector obtenido: ${sectorToUse}`);

    logger.info((`Buscando terminología del sector: ${sector}`));
    terminology = getSectorTerminology(sector);
    logger.info((`Terminología del sector obtenida: ${terminology}`));

    logger.info('Creando tienda asociada')
    newStore = await stores.create({
      account: newAccount._id,
      name: `Mi tienda virtual`,
      description: `Tienda creada por ${names}`,
      sector: sector,
      terminology: terminology,
    });
    logger.info(`Tienda creada: ${newStore._id}`);

    logger.info('Creando sesion asociado')
    const expiresAt = new Date(Date.now() + variables.server.sessionTimeout * 60 * 60 * 1000);
    newSession = await accountSessions.create({
      account: newAccount._id,
      expiresAt
    });
    logger.info(`Sesion creada: ${newSession._id}`);

    logger.info('Validando código o plan seleccionado');
    if (code) {
      logger.info('Validando código promocional');
      planToUse = await planCodes.findOne({ code, status: 'valid' });
      if (!planToUse) throw exceptions.badRequest('El código no existe o ya fue usado');

      planToUse.endDate = new Date(new Date().setDate(new Date().getDate() + planToUse.daysTrial));
      planToUse.status = 'used';
      await planToUse.save();
      planToUse.subStatus = 'promo';
      logger.info('Consumiendo código promocional');
    } else {
      logger.info('Validando plan seleccionado');
      const plansYaml = getPlans();
      if (!plansYaml?.plans?.[plan]) throw exceptions.badRequest('El plan no existe');

      planToUse = {
        code: plan,
        endDate: new Date(new Date().setDate(new Date().getDate() + (plansYaml.plans[plan]?.trial?.days || 0))),
        status: 'trial',
        preferentialPrice: plansYaml.plans[plan]?.price,
        subStatus: 'trial'
      };
      logger.info('Consumiendo plan seleccionado');
    }

    logger.info(`Codigo promocional: ${planToUse.code}`);
    logger.info(`Fecha de expiracion: ${formatDate(planToUse.endDate)}`);
    logger.info(`Precio preferencial: ${planToUse.preferentialPrice}`);
    logger.info(`Estado de la suscripcion: ${planToUse.status}`);

    logger.info('Creando suscripcion asociada');
    newSubscription = await accountSubscriptions.create({
      account: newAccount._id,
      plan: planToUse.code,
      endDate: planToUse.endDate,
      subStatus: planToUse.subStatus
    });
    logger.info(`Suscripcion creada: ${newSubscription._id}`);

    logger.info(`Creando token de acceso`);
    const accessToken = await generateToken({
      session: newSession._id.toString(),
      account: {
        id: newAccount._id.toString(),
        type: "business_account",
        names: newAccount.names,
        email: newAccount.email
      },
      store: newStore._id.toString(),
      subscription: newSubscription._id.toString(),
    });
    logger.info(`Token de acceso creado`);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: variables.server.env !== 'development',
      sameSite: 'lax',
      maxAge: parseExpirationTime(),
    });

    const accountProfilePhoto = await accountProfiles.findOne({ account: newAccount._id });
    const profileData = {
      paternalSurnames: newAccount.paternalSurnames,
      maternalSurnames: newAccount.maternalSurnames,
      names: newAccount.names,
      type: "business_account",
      profilePhoto: accountProfilePhoto.profilePhoto ? accountProfilePhoto.profilePhoto._id : null
    };

    if (variables.server.env === 'development') return res.status(201).send({ ...profileData, accessToken });

    return res.status(201).send(profileData);
  } catch (error) {
    if (newSubscription) await accountSubscriptions.findByIdAndDelete(newSubscription._id);
    if (newSession) await accountSessions.findByIdAndDelete(newSession._id);
    if (newStore) await stores.findByIdAndDelete(newStore._id);
    if (newAccount) await accounts.findByIdAndDelete(newAccount._id);
    logger.error(`Ocurrio algo inesperado en el proceso de registro: ${error.message}`);
    return next(error);
  }
});

router.post("/sign-in", validateBody(Joi.object({
  identifier: Joi.string()
    .pattern(/^[A-Za-z0-9@._+-]{5,64}$/)
    .required(),
  password: Joi.string().required()
})), async (req, res, next) => {
  const { identifier, password } = req.body;
  const account = await accounts.findOne({
    $or: [
      { email: identifier },
      { phone: identifier },
      { document: identifier }
    ]
  });
  if (!account) throw exceptions.unauthorized('Credenciales inválidas');

  const valid = await comparePassword(password, account.password);
  if (!valid) throw exceptions.unauthorized('Credenciales inválidas');

  let session = await accountSessions.findOne({ account: account._id });
  const now = new Date();
  if (!session) {
    logger.info('No existe sesion previa para este usuario.');
    const expiresAt = new Date(now.getTime() + variables.server.sessionTimeout * 60 * 60 * 1000);
    session = await accountSessions.create({ account: account._id, expiresAt, status: 'active' });
  } else {
    logger.info(`Estado de la sesion: ${session.status}`);
    logger.info(`Fecha de expiracion de la sesion: ${formatDate(session.expiresAt)}`);

    const expiresAtDate = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
    const isExpired = expiresAtDate < now;
    if (session.status === 'logout') {
      session.status = 'active';
      session.expiresAt = new Date(now.getTime() + variables.server.sessionTimeout * 60 * 60 * 1000);
      await session.save();
    } else if (session.status === 'active' && isExpired) {
      session.expiresAt = new Date(now.getTime() + variables.server.sessionTimeout * 60 * 60 * 1000);
      await session.save();
    } else if (session.status === 'active' && !isExpired) {
      throw exceptions.unauthorized('Sesion ya activa y vigente.');
    } else {
      throw exceptions.unauthorized('Sesion inválida');
    }
  }

  const accountProfilePhoto = await accountProfiles.findOne({ account: account._id })
    .populate('profilePhoto');
  if (!accountProfilePhoto) throw exceptions.notFound('Perfil no encontrado');

  const profileData = {
    paternalSurnames: account.paternalSurnames,
    maternalSurnames: account.maternalSurnames,
    names: account.names,
    type: "business_account",
    profilePhoto: accountProfilePhoto.profilePhoto ? accountProfilePhoto.profilePhoto._id : null
  };

  const store = await stores.findOne({ account: account._id });

  const accessToken = await generateToken({
    session: session._id.toString(),
    account: {
      id: account._id.toString(),
      type: "business_account",
      names: account.names,
      email: account.email
    },
    store: store._id.toString()
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: variables.server.env !== 'development',
    sameSite: 'lax',
    maxAge: parseExpirationTime(),
  });

  if (variables.server.env === 'development') return res.status(200).send({ ...profileData, accessToken });
  return res.status(200).send(profileData);
});

router.get("/recover/:identifier", validateParams(Joi.object({
  identifier: Joi.string()
    .pattern(/^[A-Za-z0-9@._+-]{5,64}$/)
    .required(),
})), async (req, res) => {
  const { identifier } = req.params;
  logger.info(`Iniciando proceso de recuperacion de cuenta para: ${identifier}`);

  const account = await accounts.findOne({
    $or: [
      { email: identifier },
      { document: identifier }
    ]
  });

  logger.info(`Cuenta encontrada: ${account ? account._id : 'no encontrada'}`);

  if (!account) throw exceptions.unauthorized("La cuenta proporcionada no existe");

  const expiresAt = new Date(Date.now() + variables.recover.timeoutMinutes * 60 * 1000);
  logger.info(`Fecha de expiracion de la sesion: ${formatDate(expiresAt)}`);
  const code = uuidv4();

  let recover = await accountRecoveries.findOne({ account: account._id });
  if (recover) {
    logger.info(`Recuperacion existente encontrada: ${recover._id}, actualizando código y expiracion.`);
    recover.code = code;
    recover.expiresAt = expiresAt;
    recover.status = 'active';
    await recover.save();
  } else {
    recover = new accountRecoveries({
      account: account._id,
      code,
      expiresAt,
    });
    await recover.save();
    logger.info(`Recuperacion creada: ${recover._id}`);
  }

  logger.info(`Enviando correo de recuperacion a: ${account.email}`);
  await sendRecoveryEmail(account.email, code);
  logger.info(`Correo de recuperacion enviado a: ${account.email}`);

  res.json({
    message: "Si la cuenta existe, se ha enviado un enlace de recuperación"
  });
});

router.get("/validate-code/:code", validateParams(Joi.object({
  code: Joi.string().guid({ version: "uuidv4" }).required(),
})), async (req, res) => {
  const { code } = req.params;

  const recover = await accountRecoveries.findOne({
    code,
    expiresAt: { $gt: new Date() },
  }).populate("account");

  if (!recover) throw exceptions.unauthorized("Token inválido o expirado");

  res.send();
});

router.post("/reset-password", validateBody(Joi.object({
  code: Joi.string().guid({ version: "uuidv4" }).required(),
  password: Joi.string().alphanum().min(8).max(22).required(),
})), async (req, res) => {
  const { code, password } = req.body;

  const recover = await accountRecoveries.findOne({
    code,
    expiresAt: { $gt: new Date() },
  }).populate("account");

  if (!recover) throw exceptions.unauthorized("Token inválido o expirado");

  const hashedPassword = await hashPassword(password);

  recover.account.password = hashedPassword;
  await recover.account.save();

  await accountSessions.deleteMany({
    account: recover.account._id,
  });

  await accountRecoveries.deleteOne({ _id: recover._id });

  res.json({
    message: "Contraseña actualizada exitosamente"
  });
});

router.get("/validate-session", authentication, async (req, res) => {
  try {
    logger.info(`Validacion de sesion exitosa para account: ${req.account.account.id || 'desconocido'}`);
    res.send();
  } catch (error) {
    logger.error('Ocurrio algo inesperado en validate-session: ' + error.message);
    throw exceptions.unauthorized();
  }
});

router.get("/logout", authentication, async (req, res) => {
  try {
    const { account, session } = req.account;
    logger.info(`Cerrando sesion de usuario: ${account.id}, sessionId: ${session}`);

    logger.info('Validando sesion');

    const result = await accountSessions.updateOne(
      { _id: session, account: account.id, status: 'active' },
      { $set: { status: 'logout' } }
    );

    if (result.matchedCount === 0) {
      logger.warn(`No se encontró sesion activa para account ${account.id} y sessionId ${session}`);
    } else {
      logger.info('Sesion cerrada');
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: variables.server.env === 'production',
      sameSite: 'strict'
    });

    res.send();
  } catch (error) {
    logger.error(`Ocurrio algo inesperado al cerrar la sesion: ${error.message}`);
    throw exceptions.unauthorized();
  }
});

module.exports = router;
