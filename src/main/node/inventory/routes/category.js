const express = require('express');
const router = express.Router();
const Category = require('../schemas/categories');
const { resolveActor, formatDate } = require('../../common');

router.post('/create-category', async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const { name, description, parentCategory } = req.body;
    const createdBy = await resolveActor({ id: account.id, type: account.type });
    const category = new Category({
      name,
      description,
      parentCategory,
      store,
      isVisible: true,
      createdBy,
      updatedBy: createdBy
    });
    await category.save();
    res.status(201).json({ message: 'Recurso creado' });
  } catch (err) {
    next(err);
  }
});

router.put('/update-category', async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const { id, name, description, parentCategory, isVisible } = req.body;
    const updatedBy = await resolveActor({ id: account.id, type: account.type });
    const update = {
      ...(name && { name }),
      ...(description && { description }),
      ...(parentCategory !== undefined && { parentCategory }),
      ...(isVisible !== undefined && { isVisible }),
      updatedBy
    };
    const category = await Category.findOneAndUpdate({ _id: id, store }, update, { new: true });
    if (!category) return res.status(404).json({ message: 'Recurso no encontrado' });
    res.json({ message: 'Operación exitosa' });
  } catch (err) {
    next(err);
  }
});

router.get('/detail-category/:id', async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const { id } = req.params;

      const category = await Category.findOne({ _id: id, store }).populate('parentCategory', 'name');
      if (!category) return res.status(204).json({ message: 'Recurso no encontrado' });

      const createdBy = await resolveActor({ id: category.createdBy.id, type: category.createdBy.type });
      const updatedBy = await resolveActor({ id: category.updatedBy.id, type: category.updatedBy.type });

      const response = {
        id: category._id,
        name: category.name,
        description: category.description,
        isVisible: category.isVisible,
        createdAt: formatDate(category.createdAt),
        updatedAt: formatDate(category.updatedAt),
        createdBy,
        updatedBy
      };
      if (category.parentCategory && category.parentCategory.name) {
        response.parentCategory = category.parentCategory.name;
      }
      res.json(response);
  } catch (err) {
    next(err);
  }
});

router.delete('/delete-category/:id', async (req, res, next) => {
  try {
    const { store } = req.account;
    const { id } = req.params;
    const deleted = await Category.findOneAndDelete({ _id: id, store });
    if (!deleted) return res.status(404).json({ message: 'Recurso no encontrado' });
    res.status(204).json({ message: 'Recurso eliminado' });
  } catch (err) {
    next(err);
  }
});

router.post('/pagination-category', async (req, res, next) => {
  try {
    const { store } = req.account;
    const { page = 1, perPage = 10, name, parentCategory, isVisible, createdAtGte, createdAtLte } = req.body || {};
    const filter = { store };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (parentCategory) filter.parentCategory = parentCategory;
    if (typeof isVisible === 'boolean') filter.isVisible = isVisible;
    if (createdAtGte || createdAtLte) filter.createdAt = {};
    if (createdAtGte) filter.createdAt.$gte = new Date(createdAtGte);
    if (createdAtLte) filter.createdAt.$lte = new Date(createdAtLte);
    const totalItems = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / perPage);
      const rows = await Category.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(Math.min(perPage, 30))
        .select('name parentCategory isVisible createdAt createdBy')
        .populate('parentCategory', 'name');

      const data = await Promise.all(
        rows.map(async c => {
          const createdBy = await resolveActor({ id: c.createdBy.id, type: c.createdBy.type });
          const item = {
            id: c._id,
            name: c.name,
            isVisible: c.isVisible,
            createdAt: formatDate(c.createdAt),
            createdBy: createdBy.names
          };
          if (c.parentCategory && c.parentCategory.name) {
            item.parentCategory = c.parentCategory.name;
          }
          return item;
        })
      );
      res.json({
        pagination: { page, perPage, totalPages, totalItems },
        data
      });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
