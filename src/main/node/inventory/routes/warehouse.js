
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Warehouse = require('../schemas/warehouses');
const { exceptions, resolveActor, validateBody, validateParams } = require('../../common');

router.post('/create-warehouse', validateBody(Joi.object({
  name: Joi.string().min(1).max(32).required(),
  description: Joi.string().min(1).max(64).optional(),
})), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const actor = await resolveActor(account);
    const { name, description } = req.body;
    const warehouse = new Warehouse({
      name,
      description,
      store,
      createdBy: actor,
      updatedBy: actor
    });
    await warehouse.save();
    res.status(201).json({ message: 'Recurso creado' });
  } catch (err) {
    next(err);
  }
});

router.put('/update-warehouse', validateBody(Joi.object({
  id: Joi.string().length(24).required(),
  name: Joi.string().min(1).max(32).optional(),
  description: Joi.string().min(1).max(64).optional(),
  isVisible: Joi.boolean().optional()
})), async (req, res, next) => {
  try {
    const { store, account } = req.account;
    if (!store) throw exceptions.unauthorized();
    const actor = await resolveActor(account);
    const { id, name, description, isVisible } = req.body;
    const warehouse = await Warehouse.findOne({ _id: id, store });
    if (!warehouse) throw exceptions.notFound('Almacén no encontrado');
    if (name !== undefined) warehouse.name = name;
    if (description !== undefined) warehouse.description = description;
    if (isVisible !== undefined) warehouse.isVisible = isVisible;
    warehouse.updatedBy = actor;
    await warehouse.save();
    res.json({ message: 'Operación exitosa' });
  } catch (err) {
    next(err);
  }
});

router.get('/detail-warehouse/:id', validateParams(Joi.object({
  id: Joi.string().length(24).required()
})), async (req, res, next) => {
  try {
    const { store } = req.account;
    if (!store) throw exceptions.unauthorized();
    const { id } = req.params;
    const warehouse = await Warehouse.findOne({ _id: id, store });
    if (!warehouse) throw exceptions.notFound('Almacén no encontrado');
    res.json({
      id: warehouse._id,
      name: warehouse.name,
      description: warehouse.description,
      isVisible: warehouse.isVisible,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
      createdBy: warehouse.createdBy,
      updatedBy: warehouse.updatedBy
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/delete-warehouse/:id', validateParams(Joi.object({
  id: Joi.string().length(24).required()
})), async (req, res, next) => {
  try {
    const { store } = req.account;
    if (!store) throw exceptions.unauthorized();
    const { id } = req.params;
    const deleted = await Warehouse.findOneAndDelete({ _id: id, store });
    if (!deleted) throw exceptions.notFound('Almacén no encontrado');
    res.status(204).json({ message: 'Operación exitosa sin datos' });
  } catch (err) {
    next(err);
  }
});

router.post('/pagination-warehouse', validateBody(Joi.object({
  page: Joi.number().min(1).default(1),
  perPage: Joi.number().min(1).max(100).default(10),
  name: Joi.string().min(1).max(32).optional(),
  isVisible: Joi.boolean().optional(),
  createdAtGte: Joi.date().optional(),
  createdAtLte: Joi.date().optional()
})), async (req, res, next) => {
  try {
    const { store } = req.account;
    if (!store) throw exceptions.unauthorized();
    const { page = 1, perPage = 10, name, isVisible, createdAtGte, createdAtLte } = req.body;
    const query = { store };
    if (name) query.name = { $regex: name, $options: 'i' };
    if (isVisible !== undefined) query.isVisible = isVisible;
    if (createdAtGte) query.createdAt = { ...query.createdAt, $gte: new Date(createdAtGte) };
    if (createdAtLte) query.createdAt = { ...query.createdAt, $lte: new Date(createdAtLte) };
    const totalItems = await Warehouse.countDocuments(query);
    const data = await Warehouse.find(query)
      .skip((page - 1) * perPage)
      .limit(Math.min(perPage, 30))
      .sort({ createdAt: -1 });
    res.json({
      pagination: {
        page,
        perPage,
        totalPages: Math.ceil(totalItems / perPage),
        totalItems
      },
      data: data.map(w => ({
        id: w._id,
        name: w.name,
        isVisible: w.isVisible,
        createdAt: w.createdAt,
        createdBy: w.createdBy
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
