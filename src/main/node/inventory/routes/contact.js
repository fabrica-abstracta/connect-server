const express = require('express');
const router = express.Router();
const Contact = require('../schemas/contacts');
const { resolveActor, formatDate } = require('../../common');

router.post('/create-contact', async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const { document, code, type, name, description, contact, address } = req.body;
    const createdBy = await resolveActor({ id: account.id, type: account.type });
    const contactDoc = new Contact({
      document,
      code,
      type,
      name,
      description,
      contact,
      address,
      store,
      isVisible: true,
      createdBy,
      updatedBy: createdBy
    });
    await contactDoc.save();
    res.status(201).json({ message: 'Recurso creado' });
  } catch (err) {
    next(err);
  }
});

router.put('/update-contact', async (req, res, next) => {
  try {
    const { store, account } = req.account;
    const { id, document, code, type, name, description, contact, address, isVisible } = req.body;
    const updatedBy = await resolveActor({ id: account.id, type: account.type });
    const update = {
      ...(document && { document }),
      ...(code && { code }),
      ...(type && { type }),
      ...(name && { name }),
      ...(description && { description }),
      ...(contact && { contact }),
      ...(address && { address }),
      ...(isVisible !== undefined && { isVisible }),
      updatedBy
    };
    const contactDoc = await Contact.findOneAndUpdate({ _id: id, store }, update, { new: true });
    if (!contactDoc) return res.status(404).json({ message: 'Recurso no encontrado' });
    res.json({ message: 'Operación exitosa' });
  } catch (err) {
    next(err);
  }
});

router.get('/detail-contact/:id', async (req, res, next) => {
  try {
    const { store } = req.account;
    const { id } = req.params;
    const contactDoc = await Contact.findOne({ _id: id, store });
    if (!contactDoc) return res.status(204).json({ message: 'Recurso no encontrado' });
    const createdBy = await resolveActor({ id: contactDoc.createdBy.id, type: contactDoc.createdBy.type });
    const updatedBy = await resolveActor({ id: contactDoc.updatedBy.id, type: contactDoc.updatedBy.type });
    res.json({
      id: contactDoc._id,
      document: contactDoc.document,
      code: contactDoc.code,
      type: contactDoc.type,
      name: contactDoc.name,
      description: contactDoc.description,
      contact: contactDoc.contact,
      address: contactDoc.address,
      isVisible: contactDoc.isVisible,
      createdAt: formatDate(contactDoc.createdAt),
      updatedAt: formatDate(contactDoc.updatedAt),
      createdBy,
      updatedBy
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/delete-contact/:id', async (req, res, next) => {
  try {
    const { store } = req.account;
    const { id } = req.params;
    const deleted = await Contact.findOneAndDelete({ _id: id, store });
    if (!deleted) return res.status(404).json({ message: 'Recurso no encontrado' });
    res.status(204).json({ message: 'Recurso eliminado' });
  } catch (err) {
    next(err);
  }
});

router.post('/pagination-contact', async (req, res, next) => {
  try {
    const { store } = req.account;
    const { page = 1, perPage = 10, name, type, isVisible, createdAtGte, createdAtLte } = req.body || {};
    const filter = { store };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (type) filter.type = type;
    if (typeof isVisible === 'boolean') filter.isVisible = isVisible;
    if (createdAtGte || createdAtLte) filter.createdAt = {};
    if (createdAtGte) filter.createdAt.$gte = new Date(createdAtGte);
    if (createdAtLte) filter.createdAt.$lte = new Date(createdAtLte);
    const totalItems = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / perPage);
    const rows = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(Math.min(perPage, 30))
      .select('document code type name isVisible createdAt createdBy');
    const data = await Promise.all(
      rows.map(async c => {
        const createdBy = await resolveActor({ id: c.createdBy.id, type: c.createdBy.type });
        return {
          id: c._id,
          document: c.document,
          code: c.code,
          type: c.type,
          name: c.name,
          isVisible: c.isVisible,
          createdAt: formatDate(c.createdAt),
          createdBy: createdBy.names
        };
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
