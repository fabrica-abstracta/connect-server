const express = require('express');
const multer = require('multer');
const File = require('../schemas/file');
const { exceptions } = require('../../common');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw exceptions.badRequest('No se ha proporcionado ningún archivo');

    const newFile = new File({
      name: req.file.originalname,
      buffer: req.file.buffer,
      mimetype: req.file.mimetype
    });

    const savedFile = await newFile.save();

    res.status(201).json({
      id: savedFile._id,
      name: savedFile.name,
      mimetype: savedFile.mimetype,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/get-file/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) throw exceptions.notFound('Archivo no encontrado');

    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `inline; filename="${file.name}"`
    });

    res.send(file.buffer);
  } catch (error) {
    next(error);
  }
});

router.delete('/delete-file/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedFile = await File.findByIdAndDelete(id);
    if (!deletedFile) throw exceptions.notFound('Archivo no encontrado');

    res.status(200).json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;