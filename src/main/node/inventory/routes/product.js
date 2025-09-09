const express = require('express');
const router = express.Router();
const Joi = require('joi');

const Product = require('../schemas/products');

const { exceptions, validateBody, validateParams, resolveActor, formatDate } = require('../../common');

router.post('/create-product', validateBody(Joi.object({
  name: Joi.string().min(2).max(64).required(),
  description: Joi.string().optional().allow(''),
  sku: Joi.string().pattern(/^[A-Za-z0-9_-]{3,12}$/).optional(),
  brand: Joi.string().min(2).max(32).optional(),
  category: Joi.string().min(2).max(32).optional(),
  unit: Joi.string().min(1).max(16).optional(),
  salePrice: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('available', 'for_exhaustion', 'exhausted').optional(),
  isVisible: Joi.boolean().optional(),
})), async (req, res) => {
  try {
    const { store, account } = req.account;

    logger.info("Creating brand for account:", account);
    logger.info("Creating brand for store:", store);

    const createdBy = await resolveActor({ id: account.id, type: account.type });

    const product = new Product({
      ...req.body,
      store,
      createdBy,
      updatedBy: createdBy
    });

    await product.save();
    res.status(201).json({ message: 'Registro creado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al crear el registro:", err);
    next(err);
  }
});

router.put('/update-product', validateBody(Joi.object({
  name: Joi.string().min(2).max(64).optional(),
  description: Joi.string().optional().allow(''),
  sku: Joi.string().pattern(/^[A-Za-z0-9_-]{3,12}$/).optional(),
  brand: Joi.string().min(2).max(32).optional(),
  category: Joi.string().min(2).max(32).optional(),
  unit: Joi.string().min(1).max(16).optional(),
  salePrice: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('available', 'for_exhaustion', 'exhausted').optional(),
  isVisible: Joi.boolean().optional(),
})), async (req, res) => {
  try {
    const { store, account } = req.account;

    const updatedBy = await resolveActor({ id: account.id, type: account.type });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, store },
      { ...req.body, updatedBy },
      { new: true }
    );

    if (!product) throw exceptions.notFound('Registro no encontrado');

    res.json({ message: 'Registro actualizado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al actualizar el registro:", err);
    next(err);
  }
});

router.get('/detail-product/:id', validateParams(Joi.object({
  id: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
})), async (req, res) => {
  try {
    const { store } = req.account;

    const product = await Product.findOne({ _id: req.params.id, store });
    if (!product) throw exceptions.notFound();

    const createdBy = await resolveActor({ id: product.createdBy.id, type: product.createdBy.type });
    const updatedBy = await resolveActor({ id: product.updatedBy.id, type: product.updatedBy.type });

    res.json({
      id: product._id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      unit: product.unit,
      salePrice: product.salePrice,
      stock: product.stockCurrent,
      status: product.status,
      isVisible: product.isVisible,
      createdAt: formatDate(product.createdAt),
      updatedAt: formatDate(product.updatedAt),
      createdBy,
      updatedBy
    });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al obtener el registro:", err);
    next(err);
  }
});

router.delete('/delete-product/:id', validateParams(Joi.object({
  id: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
})), async (req, res) => {
  try {
    const { store } = req.account;

    const product = await Product.findOneAndDelete({ _id: req.params.id, store });
    if (!product) throw exceptions.notFound();

    res.status(204).json({ message: 'Registro eliminado exitosamente' });
  } catch (err) {
    logger.error("Ocurrió algo inesperado al eliminar el registro:", err);
    next(err);
  }
});

router.post('/pagination-product', validateBody(Joi.object({
  page: Joi.number().integer().min(1).optional(),
  perPage: Joi.number().integer().min(1).max(30).optional(),
  sku: Joi.string().pattern(/^[A-Za-z0-9_-]{3,12}$/).optional(),
  name: Joi.string().min(2).max(64).optional(),
  brand: Joi.string().min(2).max(32).optional(),
  category: Joi.string().min(2).max(32).optional(),
  unit: Joi.string().min(1).max(16).optional(),
  status: Joi.string().valid('available', 'for_exhaustion', 'exhausted').optional(),
  isVisible: Joi.boolean().optional(),
  createdAtGte: Joi.date().optional(),
  createdAtLte: Joi.date().optional(),
})), async (req, res) => {
  try {
    const { store } = req.account;
    const {
      page = 1,
      perPage = 10,
      sku,
      name,
      brand,
      category,
      unit,
      status,
      isVisible,
      createdAtGte,
      createdAtLte
    } = req.body;

    const filters = { store };
    if (sku) filters.sku = sku;
    if (name) filters.name = new RegExp(name, 'i');
    if (brand) filters.brand = brand;
    if (category) filters.category = category;
    if (unit) filters.unit = unit;
    if (status) filters.status = status;
    if (isVisible !== undefined) filters.isVisible = isVisible;
    if (createdAtGte || createdAtLte) {
      filters.createdAt = {};
      if (createdAtGte) filters.createdAt.$gte = new Date(createdAtGte);
      if (createdAtLte) filters.createdAt.$lte = new Date(createdAtLte);
    }

    const totalItems = await Product.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / perPage);
    const products = await Product.find(filters)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const data = products.map(product => ({
      id: product._id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      unit: product.unit,
      salePrice: product.salePrice,
      stock: product.stockCurrent,
      status: product.status,
      isVisible: product.isVisible,
      createdAt: formatDate(product.createdAt),
      createdBy: product.createdBy.id,
    }));

    res.status(200).json({
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
