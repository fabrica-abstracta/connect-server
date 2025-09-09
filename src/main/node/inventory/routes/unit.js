const express = require('express');
const Joi = require('joi');
const Units = require('../schemas/units');
const { validateBody, validateParams, exceptions, resolveActor } = require('../../common');

const router = express.Router();

router.post('/create-unit', validateBody(Joi.object({
  name: Joi.string().min(1).max(32).required(),
  description: Joi.string().min(1).max(64).optional(),
  symbol: Joi.string().min(1).max(16).required(),
  system: Joi.string().valid('SI', 'Imperial', 'USC', 'Custom').required(),
  dimension: Joi.string().valid('unit', 'mass', 'length', 'time', 'temperature', 'area', 'volume', 'velocity', 'acceleration', 'other').required(),
  isBase: Joi.boolean().required(),
  baseUnit: Joi.string().length(24).optional(),
  factor: Joi.number().required(),
  offset: Joi.number().optional(),
  numerator: Joi.array().items(Joi.string().min(1).max(32)).optional(),
  denominator: Joi.array().items(Joi.string().min(1).max(32)).optional(),
  aliases: Joi.array().items(Joi.string().min(1).max(32)).optional(),
  precision: Joi.number().integer().optional(),
  store: Joi.string().length(24).required(),
  isVisible: Joi.boolean().optional()
})), async (req, res, next) => {
  try {
    const { account } = req.account;
    const actor = await resolveActor(account);
    const data = {
      ...req.body,
      createdBy: actor,
      updatedBy: actor
    };
    const unit = await Units.create(data);
    res.status(201).json({ message: 'Unidad creada', id: unit._id });
  } catch (err) {
    next(err);
  }
});

// Actualizar unidad
router.put('/update-unit', validateBody(Joi.object({
  id: Joi.string().length(24).required(),
  name: Joi.string().min(1).max(32).optional(),
  description: Joi.string().min(1).max(64).optional(),
  symbol: Joi.string().min(1).max(16).optional(),
  system: Joi.string().valid('SI', 'Imperial', 'USC', 'Custom').optional(),
  dimension: Joi.string().valid('unit', 'mass', 'length', 'time', 'temperature', 'area', 'volume', 'velocity', 'acceleration', 'other').optional(),
  isBase: Joi.boolean().optional(),
  baseUnit: Joi.string().length(24).optional(),
  factor: Joi.number().optional(),
  offset: Joi.number().optional(),
  numerator: Joi.array().items(Joi.string().min(1).max(32)).optional(),
  denominator: Joi.array().items(Joi.string().min(1).max(32)).optional(),
  aliases: Joi.array().items(Joi.string().min(1).max(32)).optional(),
  precision: Joi.number().integer().optional(),
  store: Joi.string().length(24).optional(),
  isVisible: Joi.boolean().optional()
})), async (req, res, next) => {
  try {
    const { account } = req.account;
    const actor = await resolveActor(account);
    const { id, ...update } = req.body;
    const unit = await Units.findByIdAndUpdate(id, { ...update, updatedBy: actor }, { new: true });
    if (!unit) throw exceptions.notFound('Unidad no encontrada');
    res.json({ message: 'Unidad actualizada', id: unit._id });
  } catch (err) {
    next(err);
  }
});

// Detalle de unidad (respuesta alineada al contrato OpenAPI)
router.get('/detail-unit/:id', validateParams(Joi.object({
  id: Joi.string().length(24).required()
})), async (req, res, next) => {
  try {
    const unit = await Units.findById(req.params.id);
    if (!unit) throw exceptions.notFound('Unidad no encontrada');
    res.json({
      id: unit._id,
      document: unit.symbol, // No hay campo document real, se usa symbol como identificador
      type: 'unit',
      name: unit.name,
      description: unit.description,
      unit: {
        email: '', // No existe en schema, se deja vacío
        phone: '', // No existe en schema, se deja vacío
        website: '' // No existe en schema, se deja vacío
      },
      address: {
        street: '' // No existe en schema, se deja vacío
      },
      isVisible: unit.isVisible,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
      createdBy: unit.createdBy,
      updatedBy: unit.updatedBy
    });
  } catch (err) {
    next(err);
  }
});

// Eliminar unidad
router.delete('/delete-unit/:id', validateParams(Joi.object({
  id: Joi.string().length(24).required()
})), async (req, res, next) => {
  try {
    const unit = await Units.findByIdAndDelete(req.params.id);
    if (!unit) throw exceptions.notFound('Unidad no encontrada');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Paginación de unidades (respuesta alineada al contrato OpenAPI)
router.post('/pagination-unit', validateBody(Joi.object({
  page: Joi.number().integer().min(1).default(1),
  perPage: Joi.number().integer().min(1).max(30).default(10),
  document: Joi.string().optional(),
  type: Joi.string().valid('client', 'provider', 'unit').optional(),
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  isVisible: Joi.boolean().optional()
})), async (req, res, next) => {
  try {
    const { page, perPage, document, type, name, email, phone, isVisible } = req.body;
    // Solo filtrar por campos reales del schema
    const query = {};
    if (name) query.name = name;
    if (isVisible !== undefined) query.isVisible = isVisible;
    if (document) query.symbol = document;
    // type, email, phone no existen en schema, se ignoran en filtro
    const totalItems = await Units.countDocuments(query);
    const totalPages = Math.ceil(totalItems / perPage);
    const items = await Units.find(query).skip((page - 1) * perPage).limit(perPage);
    res.json({
      pagination: {
        page,
        perPage,
        totalPages,
        totalItems
      },
      data: items.map(unit => ({
        id: unit._id,
        name: unit.name,
        type: 'unit',
        email: '',
        isVisible: unit.isVisible,
        createdAt: unit.createdAt,
        createdBy: unit.createdBy && unit.createdBy.names ? unit.createdBy.names : ''
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
