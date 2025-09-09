const express = require('express');
const router = express.Router();
const Joi = require('joi');

const stores = require('../../authentication/schemas/stores');
const storeSettings = require('../../authentication/schemas/storeSettings');

const { 
  validateBody, 
  validateParams, 
  exceptions, 
  resolveActor,
  logger
} = require('../../common');

const { getSector, getSectorTerminology, getSectors } = require('../../common/config/data');

router.get('/sectors', async (req, res, next) => {
  try {
    logger.info("Consultando sectores disponibles");

    const sectorsData = getSectors();
    if (!sectorsData || !sectorsData.sectors) {
      throw exceptions.internal('Error al cargar los sectores');
    }

    const sectorsArray = Object.keys(sectorsData.sectors).map(key => ({
      key: key,
      name: sectorsData.sectors[key].name,
      description: sectorsData.sectors[key].description,
      terminology: sectorsData.sectors[key].terminology
    }));

    logger.info("Sectores consultados exitosamente");

    res.status(200).json(sectorsArray);
  } catch (err) {
    logger.error("Ocurrió algo inesperado al consultar los sectores:", err);
    next(err);
  }
});

router.get('/detail-store', async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const storeId = store;

    logger.info("Consultando detalle de la tienda para:", storeId);
    logger.info("Por la cuenta:", account.id);

    const storeData = await stores.findById(storeId);
    if (!storeData) {
      throw exceptions.notFound('Tienda no encontrada');
    }

    let settingsData = await storeSettings.findOne({ store: storeId });
    if (!settingsData) {
      settingsData = await storeSettings.create({
        store: storeId,
        showStock: false,
        infiniteStock: false,
        showItemsWithPromotions: false,
        isPublic: false
      });
      logger.info("Configuraciones de tienda creadas por defecto:", storeId);
    }

    const responseData = {
      name: storeData.name,
      description: storeData.description,
      sector: storeData.sector,
      terminology: storeData.terminology,
      address: {
        street: storeData.address?.street || '',
        city: storeData.address?.city || '',
        state: storeData.address?.state || '',
        country: storeData.address?.country || '',
        zipCode: storeData.address?.zipCode || '',
        coordinates: {
          latitude: storeData.address?.coordinates?.latitude || '',
          longitude: storeData.address?.coordinates?.longitude || ''
        }
      },
      contact: {
        phone: storeData.contact?.phone || '',
        email: storeData.contact?.email || '',
        website: storeData.contact?.website || ''
      },
      settings: {
        showStock: settingsData.showStock,
        infiniteStock: settingsData.infiniteStock,
        showItemsWithPromotions: settingsData.showItemsWithPromotions,
        isPublic: settingsData.isPublic
      },
      createdAt: storeData.createdAt,
      updatedAt: storeData.updatedAt
    };

    logger.info("Detalle de tienda consultado:", storeId);

    res.status(200).json(responseData);
  } catch (err) {
    logger.error("Ocurrió algo inesperado al consultar el detalle de la tienda:", err);
    next(err);
  }
});

router.put('/update-store', validateBody(Joi.object({
  name: Joi.string()
    .min(2)
    .max(32)
    .trim()
    .optional(),
  description: Joi.string()
    .max(500)
    .trim()
    .optional(),
  address: Joi.object({
    street: Joi.string().max(300).trim().optional(),
    city: Joi.string().max(300).trim().optional(),
    state: Joi.string().max(300).trim().optional(),
    country: Joi.string().max(300).trim().optional(),
    zipCode: Joi.string().max(8).trim().optional(),
    coordinates: Joi.object({
      latitude: Joi.string().max(300).trim().optional(),
      longitude: Joi.string().max(300).trim().optional()
    }).optional()
  }).optional(),
  contact: Joi.object({
    phone: Joi.string().max(12).trim().optional(),
    email: Joi.string().email().trim().optional(),
    website: Joi.string().max(300).trim().optional()
  }).optional(),
  settings: Joi.object({
    showStock: Joi.boolean().optional(),
    infiniteStock: Joi.boolean().optional(),
    showItemsWithPromotions: Joi.boolean().optional(),
    isPublic: Joi.boolean().optional()
  }).optional()
}).unknown(false)), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const storeId = store;

    logger.info("Actualizando tienda:", storeId);
    logger.info("Por la cuenta:", account.id);

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const storeUpdateData = {};
    const settingsUpdateData = {};

    if (req.body.name !== undefined) storeUpdateData.name = req.body.name;
    if (req.body.description !== undefined) storeUpdateData.description = req.body.description;
    if (req.body.address !== undefined) storeUpdateData.address = req.body.address;
    if (req.body.contact !== undefined) storeUpdateData.contact = req.body.contact;

    if (req.body.settings) {
      if (req.body.settings.showStock !== undefined) settingsUpdateData.showStock = req.body.settings.showStock;
      if (req.body.settings.infiniteStock !== undefined) settingsUpdateData.infiniteStock = req.body.settings.infiniteStock;
      if (req.body.settings.showItemsWithPromotions !== undefined) settingsUpdateData.showItemsWithPromotions = req.body.settings.showItemsWithPromotions;
      if (req.body.settings.isPublic !== undefined) settingsUpdateData.isPublic = req.body.settings.isPublic;
    }

    if (Object.keys(storeUpdateData).length > 0) {
      const updatedStore = await stores.findByIdAndUpdate(
        storeId,
        { $set: storeUpdateData },
        { new: true, runValidators: true }
      );
      
      if (!updatedStore) {
        throw exceptions.notFound('Tienda no encontrada');
      }
      
      logger.info("Datos de tienda actualizados:", storeId);
    }

    if (Object.keys(settingsUpdateData).length > 0) {
      const updatedSettings = await storeSettings.findOneAndUpdate(
        { store: storeId },
        { $set: settingsUpdateData },
        { new: true, runValidators: true, upsert: true }
      );
      
      logger.info("Configuraciones de tienda actualizadas:", storeId);
    }

    logger.info("Actualizado por:", updatedBy);

    res.status(200).json({ message: 'Registro actualizado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar la tienda:", err);
    next(err);
  }
});

router.put('/update-sector', validateBody(Joi.object({
  sector: Joi.string()
    .valid('industry', 'restaurant', 'hotel', 'retail', 'warehouse', 'pharmacy', 'gym', 'supermarket', 'bakery')
    .required()
}).unknown(false)), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const storeId = store;
    const { sector } = req.body;

    logger.info("Actualizando sector de tienda:", storeId);
    logger.info("Nuevo sector:", sector);
    logger.info("Por la cuenta:", account.id);

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const sectorData = getSector(sector);
    if (!sectorData) {
      throw exceptions.badRequest('Sector no válido');
    }

    const terminology = getSectorTerminology(sector);
    if (!terminology) {
      throw exceptions.badRequest('Terminología no encontrada para el sector');
    }

    const updatedStore = await stores.findByIdAndUpdate(
      storeId,
      { 
        $set: { 
          sector: sector,
          terminology: terminology
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedStore) {
      throw exceptions.notFound('Tienda no encontrada');
    }

    logger.info("Sector y terminología actualizados:", storeId);
    logger.info("Nueva terminología:", terminology);
    logger.info("Actualizado por:", updatedBy);

    res.status(200).json({ 
      message: 'Registro actualizado exitosamente',
      sector: sector,
      terminology: terminology
    });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar el sector:", err);
    next(err);
  }
});

module.exports = router;
