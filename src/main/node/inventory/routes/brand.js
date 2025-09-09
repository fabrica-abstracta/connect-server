const express = require('express');
const router = express.Router();
const Joi = require('joi');

const {
  validateBody,
  validateParams,
  exceptions,
  resolveActor,
  formatDate,
  getLabelAndColor,
  requiredSchemas,
  optionalSchemas
} = require('../../common');

const Brand = require('../schemas/brands');

router.post('/create-brand', validateBody(Joi.object({
  name: requiredSchemas.name,
  description: optionalSchemas.description,
}).unknown(false)), async (req, res, next) => {
  try {
    const { store, account } = req.account;

    logger.info("Creado por la cuenta:", account);
    logger.info("Creado para la tienda:", store);

    const createdBy = await resolveActor({ id: account.id, type: account.type });

    const brand = new Brand({
      ...req.body,
      store,
      createdBy,
      updatedBy: createdBy
    });

    await brand.save();

    logger.info("Registro creado:", brand._id);
    logger.info("Creado por:", createdBy);

    res.status(201).json({ message: 'Registro creado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al crear el registro:", err);
    next(err);
  }
});

router.put('/update-brand', validateBody(Joi.object({
  id: requiredSchemas.objectId,
  name: requiredSchemas.name,
  description: optionalSchemas.description,
  isVisible: optionalSchemas.isVisible,
})), async (req, res, next) => {
  try {
    const { store, account } = req.account;

    logger.info("Creado por la cuenta:", account);
    logger.info("Creado para la tienda:", store);

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const brand = await Brand.findOneAndUpdate(
      { _id: req.body.id, store },
      { $set: { ...req.body, updatedBy } },
      { new: true }
    );

    if (!brand) {
      logger.warn("Registro no encontrado:", req.body.id);
      throw exceptions.notFound('Registro no encontrado');
    }

    logger.info("Registro actualizado:", brand._id);
    logger.info("Actualizado por:", updatedBy);

    res.json({ message: 'Registro actualizado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar el registro:", err);
    next(err);
  }
});

router.get('/detail-brand/:id', validateParams(Joi.object({
  id: requiredSchemas.objectId,
})), async (req, res, next) => {
  try {
    const { store, account } = req.account;

    const brand = await Brand.findOne({ _id: req.params.id, store });
    if (!brand) {
      logger.warn("Registro no encontrado:", req.params.id);
      throw exceptions.notFound('Registro no encontrado')
    }

    const createdBy = await resolveActor({ id: brand.createdBy.id, type: brand.createdBy.type });
    const updatedBy = await resolveActor({ id: brand.updatedBy.id, type: brand.updatedBy.type });

    logger.info("Registro consultado:", req.params.id);
    logger.info("Consultado por la cuenta:", account);

    res.json({
      id: brand._id,
      name: brand.name,
      description: brand.description,
      isVisible: brand.isVisible,
      isVisibleLabel: getLabelAndColor(brand.isVisible, "isVisible"),
      createdAt: formatDate(brand.createdAt),
      updatedAt: formatDate(brand.updatedAt),
      createdBy,
      updatedBy
    });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al obtener el registro:", err);
    next(err);
  }
});

router.delete('/delete-brand/:id', validateParams(Joi.object({
  id: requiredSchemas.objectId,
})), async (req, res, next) => {
  try {
    const { store, account } = req.account;

    const deleted = await Brand.findOneAndDelete({ _id: req.params.id, store });
    if (!deleted) {
      logger.warn("Registro no encontrado:", req.params.id);
      throw exceptions.notFound('Registro no encontrado')
    };

    logger.info("Registro eliminado:", req.params.id);
    logger.info("Eliminado por la cuenta:", account);

    res.status(204).json({ message: 'Registro eliminado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al eliminar el registro:", err);
    next(err);
  }
});

router.post('/pagination-brand', validateBody(Joi.object({
  ...optionalSchemas.pagination,
  name: Joi.string()
    .trim()
    .max(32)
    .optional()
    .pattern(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]*$/)
    .messages({
      "string.max": "El filtro name no debe superar los 32 caracteres",
      "string.pattern.base": "El filtro name contiene caracteres inválidos",
    }),
  isVisible: optionalSchemas.isVisible,
  createdAtGte: Joi.date().optional(),
  createdAtLte: Joi.date().optional(),
})), async (req, res, next) => {
  try {
    const { store, account } = req.account;

    const { page = 1, perPage = 10, name, isVisible, createdAtGte, createdAtLte } = req.body || {};
    const filter = { store };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (typeof isVisible === 'boolean') filter.isVisible = isVisible;
    if (createdAtGte || createdAtLte) filter.createdAt = {};
    if (createdAtGte) filter.createdAt.$gte = new Date(createdAtGte);
    if (createdAtLte) filter.createdAt.$lte = new Date(createdAtLte);

    const totalItems = await Brand.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / perPage);
    const rows = await Brand.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(Math.min(perPage, 30))
      .select('name isVisible createdAt createdBy updatedBy');

    const data = await Promise.all(
      rows.map(async b => {
        const createdBy = await resolveActor({ id: b.createdBy.id, type: b.createdBy.type });
        return {
          id: b._id,
          name: b.name,
          isVisible: getLabelAndColor(b.isVisible, "isVisible"),
          createdAt: formatDate(b.createdAt),
          createdBy: createdBy.names
        };
      })
    );

    logger.info("Consultado por la cuenta:", account);

    res.json({
      pagination: {
        page,
        perPage,
        totalPages,
        totalItems
      },
      data
    });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al paginar los registros:", err);
    next(err);
  }
});

module.exports = router;
