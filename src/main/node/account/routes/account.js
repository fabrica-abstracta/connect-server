const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer');

const accounts = require('../../authentication/schemas/accounts');
const accountProfiles = require('../../authentication/schemas/accountProfiles');
const File = require('../../file/schemas/file');

const { 
  validateBody, 
  validateParams, 
  exceptions, 
  resolveActor,
  logger
} = require('../../common');

const { hashPassword } = require('../../common/helpers/security/security');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.put('/update-profile', validateBody(Joi.object({
  document: Joi.string()
    .pattern(/^[0-9]{8,12}$/)
    .optional(),
  paternalSurnames: Joi.string()
    .min(2)
    .max(32)
    .trim()
    .optional(),
  maternalSurnames: Joi.string()
    .min(2)
    .max(32)
    .trim()
    .optional(),
  names: Joi.string()
    .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/)
    .min(2)
    .max(32)
    .trim()
    .optional(),
  birthday: Joi.date()
    .max('now')
    .optional(),
  gender: Joi.string()
    .valid('male', 'female')
    .optional(),
  phone: Joi.string()
    .trim()
    .optional(),
  biography: Joi.string()
    .max(500)
    .trim()
    .optional(),
  timezone: Joi.string()
    .trim()
    .optional(),
  language: Joi.string()
    .trim()
    .optional()
}).unknown(false)), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const accountId = account.id;

    logger.info("Actualizando perfil para la cuenta:", accountId);
    logger.info("Para la tienda:", store);

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const accountData = {};
    const profileData = {};

    if (req.body.document !== undefined) accountData.document = req.body.document;
    if (req.body.paternalSurnames !== undefined) accountData.paternalSurnames = req.body.paternalSurnames;
    if (req.body.maternalSurnames !== undefined) accountData.maternalSurnames = req.body.maternalSurnames;
    if (req.body.names !== undefined) accountData.names = req.body.names;
    if (req.body.birthday !== undefined) accountData.birthday = req.body.birthday;
    if (req.body.gender !== undefined) accountData.gender = req.body.gender;
    if (req.body.phone !== undefined) accountData.phone = req.body.phone;

    if (req.body.biography !== undefined) profileData.biography = req.body.biography;
    if (req.body.timezone !== undefined) profileData.timezone = req.body.timezone;
    if (req.body.language !== undefined) profileData.language = req.body.language;

    if (Object.keys(accountData).length > 0) {
      const updatedAccount = await accounts.findByIdAndUpdate(
        accountId,
        { $set: accountData },
        { new: true, runValidators: true }
      );
      
      if (!updatedAccount) throw exceptions.notFound('Cuenta no encontrada');
      
      logger.info("Datos de cuenta actualizados:", accountId);
    }

    if (Object.keys(profileData).length > 0) {
      const updatedProfile = await accountProfiles.findOneAndUpdate(
        { account: accountId },
        { $set: profileData },
        { new: true, runValidators: true }
      );
      
      if (!updatedProfile) throw exceptions.notFound('Perfil no encontrado');
      
      logger.info("Datos de perfil actualizados:", accountId);
    }

    logger.info("Actualizado por:", updatedBy);

    res.status(200).json({ message: 'Registro actualizado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar el perfil:", err);
    next(err);
  }
});

router.put('/update-email', validateBody(Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .required()
    .max(64)
}).unknown(false)), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const accountId = account.id;
    const { email } = req.body;

    logger.info("Actualizando email para la cuenta:", accountId);
    logger.info("Para la tienda:", store);

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const existingAccount = await accounts.findOne({ 
      email: email,
      _id: { $ne: accountId }
    });

    if (existingAccount) throw exceptions.badRequest('El correo electrónico ya está en uso');

    const updatedAccount = await accounts.findByIdAndUpdate(
      accountId,
      { $set: { email } },
      { new: true, runValidators: true }
    );

    if (!updatedAccount) throw exceptions.notFound('Cuenta no encontrada');

    logger.info("Email actualizado:", accountId);
    logger.info("Actualizado por:", updatedBy);

    res.status(200).json({ message: 'Registro actualizado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar el email:", err);
    next(err);
  }
});

router.put('/update-password', validateBody(Joi.object({
  currentPassword: Joi.string()
    .required(),
  newPassword: Joi.string()
    .alphanum()
    .min(8)
    .max(22)
    .required()
}).unknown(false)), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const accountId = account.id;
    const { currentPassword, newPassword } = req.body;

    logger.info("Actualizando contraseña para la cuenta:", accountId);
    logger.info("Para la tienda:", store);

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const currentAccount = await accounts.findById(accountId);
    if (!currentAccount) throw exceptions.notFound('Cuenta no encontrada');

    const { comparePassword } = require('../../common/helpers/security/security');
    const isCurrentPasswordValid = await comparePassword(currentPassword, currentAccount.password);
    
    if (!isCurrentPasswordValid) {
      throw exceptions.badRequest('La contraseña actual es incorrecta');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    const updatedAccount = await accounts.findByIdAndUpdate(
      accountId,
      { $set: { password: hashedNewPassword } },
      { new: true }
    );

    if (!updatedAccount) throw exceptions.notFound('Cuenta no encontrada');

    logger.info("Contraseña actualizada:", accountId);
    logger.info("Actualizado por:", updatedBy);

    res.status(200).json({ message: 'Registro actualizado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar la contraseña:", err);
    next(err);
  }
});

router.put('/update-profile-photo', upload.single('profilePhoto'), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const accountId = account.id;

    logger.info("Actualizando foto de perfil para la cuenta:", accountId);
    logger.info("Para la tienda:", store);

    if (!req.file) throw exceptions.badRequest('No se ha proporcionado ningún archivo');

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const currentProfile = await accountProfiles.findOne({ account: accountId });
    if (!currentProfile) throw exceptions.notFound('Perfil no encontrado');

    const oldProfilePhotoId = currentProfile.profilePhoto;

    const newFile = new File({
      name: req.file.originalname,
      buffer: req.file.buffer,
      mimetype: req.file.mimetype
    });

    const savedFile = await newFile.save();
    const newProfilePhotoId = savedFile._id;

    logger.info("Nueva foto guardada con ID:", newProfilePhotoId);

    const updatedProfile = await accountProfiles.findOneAndUpdate(
      { account: accountId },
      { $set: { profilePhoto: newProfilePhotoId } },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) throw exceptions.notFound('Error al actualizar el perfil');

    if (oldProfilePhotoId) {
      try {
        await File.findByIdAndDelete(oldProfilePhotoId);
        logger.info("Foto anterior eliminada:", oldProfilePhotoId);
      } catch (deleteError) {
        logger.error("Error al eliminar foto anterior:", deleteError);
      }
    }

    logger.info("Foto de perfil actualizada:", accountId);
    logger.info("Actualizado por:", updatedBy);

    res.status(200).json({ 
      message: 'Registro actualizado exitosamente',
      profilePhotoId: newProfilePhotoId
    });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar la foto de perfil:", err);
    next(err);
  }
});

router.get('/detail-profile', async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const accountId = account.id;

    logger.info("Consultando detalle del perfil para la cuenta:", accountId);
    logger.info("Para la tienda:", store);

    const accountData = await accounts.findById(accountId).select('-password');
    if (!accountData) {
      throw exceptions.notFound('Cuenta no encontrada');
    }

    const profileData = await accountProfiles.findOne({ account: accountId }).populate('profilePhoto');
    if (!profileData) {
      throw exceptions.notFound('Perfil no encontrado');
    }

    const responseData = {
      document: accountData.document,
      paternalSurnames: accountData.paternalSurnames,
      maternalSurnames: accountData.maternalSurnames,
      names: accountData.names,
      birthday: accountData.birthday,
      gender: accountData.gender,
      email: accountData.email,
      phone: accountData.phone,
      biography: profileData.biography,
      timezone: profileData.timezone,
      language: profileData.language,
      profilePhoto: profileData.profilePhoto ? profileData.profilePhoto._id : null,
      createdAt: accountData.createdAt,
      updatedAt: accountData.updatedAt
    };

    logger.info("Detalle del perfil consultado:", accountId);

    res.status(200).json(responseData);
  } catch (err) {
    logger.error("Ocurrió algo inesperado al consultar el detalle del perfil:", err);
    next(err);
  }
});

module.exports = router;
