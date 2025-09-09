const express = require('express');
const router = express.Router();
const DocumentationSection = require('../../manual/schemas/section');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../../uploads/manual');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'manual-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB límite
});

/**
 * GET /saas/manual/sections
 * Obtener todas las secciones para administración
 */
router.get('/manual/sections', async (req, res) => {
  try {
    const sections = await DocumentationSection.find()
      .sort({ parentId: 1, order: 1 })
      .lean();
    
    res.json({
      success: true,
      sections: sections
    });
  } catch (error) {
    console.error('Error getting sections:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las secciones',
      error: error.message
    });
  }
});

/**
 * GET /saas/manual/section/:id
 * Obtener una sección específica por ID
 */
router.get('/manual/section/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const section = await DocumentationSection.findOne({ id: id }).lean();
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Sección no encontrada'
      });
    }
    
    res.json({
      success: true,
      section: section
    });
  } catch (error) {
    console.error('Error getting section:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la sección',
      error: error.message
    });
  }
});

/**
 * POST /saas/manual/section
 * Crear o actualizar una sección
 */
router.post('/manual/section', async (req, res) => {
  try {
    const { id, label, parentId, order, content } = req.body;
    
    if (!id || !label) {
      return res.status(400).json({
        success: false,
        message: 'ID y label son requeridos'
      });
    }
    
    const sectionData = {
      id: id.trim(),
      label: label.trim(),
      parentId: parentId?.trim() || null,
      order: parseInt(order) || 0,
      content: content || '',
      isActive: true,
      updatedAt: new Date()
    };
    
    const section = await DocumentationSection.findOneAndUpdate(
      { id: sectionData.id },
      sectionData,
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    res.json({
      success: true,
      message: 'Sección guardada correctamente',
      section: section
    });
  } catch (error) {
    console.error('Error saving section:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la sección',
      error: error.message
    });
  }
});

/**
 * DELETE /saas/manual/section/:id
 * Eliminar una sección
 */
router.delete('/manual/section/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si tiene secciones hijas
    const childSections = await DocumentationSection.find({ parentId: id });
    if (childSections.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una sección que tiene subsecciones'
      });
    }
    
    const section = await DocumentationSection.findOneAndUpdate(
      { id: id },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Sección no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Sección eliminada correctamente'
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la sección',
      error: error.message
    });
  }
});

/**
 * POST /saas/manual/upload-image
 * Subir imagen para el manual
 */
router.post('/manual/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }
    
    const imageUrl = `/uploads/manual/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Imagen subida correctamente',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
      error: error.message
    });
  }
});

/**
 * GET /saas/manual/hierarchy
 * Obtener estructura jerárquica para el índice
 */
router.get('/manual/hierarchy', async (req, res) => {
  try {
    const sections = await DocumentationSection.find({ isActive: true })
      .sort({ parentId: 1, order: 1 })
      .lean();
    
    const buildTree = (parentId = null) => {
      return sections
        .filter(section => section.parentId === parentId)
        .map(section => ({
          id: section.id,
          label: section.label,
          order: section.order,
          children: buildTree(section.id)
        }));
    };
    
    const hierarchy = buildTree();
    
    res.json({
      success: true,
      hierarchy: hierarchy
    });
  } catch (error) {
    console.error('Error getting hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la jerarquía',
      error: error.message
    });
  }
});

module.exports = router;
