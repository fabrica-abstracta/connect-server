const express = require('express');
const router = express.Router();
const DocumentationSection = require('../schemas/section');

router.post('/index', async (req, res) => {
  try {
    const sections = await DocumentationSection.getHierarchy();
    
    res.status(200).json({
      success: true,
      sections: sections
    });
  } catch (error) {
    console.error('Error getting documentation index:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el índice del manual',
      error: error.message
    });
  }
});

/**
 * POST /doc/content
 * Obtener el contenido de una sección específica
 */
router.post('/content', async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la sección es requerido'
      });
    }
    
    const section = await DocumentationSection.findOne({ 
      id: id, 
      isActive: true 
    }).lean();
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Sección no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      content: section.content || 'Contenido no disponible.',
      label: section.label,
      id: section.id
    });
  } catch (error) {
    console.error('Error getting documentation content:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el contenido del manual',
      error: error.message
    });
  }
});

/**
 * GET /doc/sections
 * Obtener todas las secciones (para administración)
 */
router.get('/sections', async (req, res) => {
  try {
    const sections = await DocumentationSection.find({ isActive: true })
      .sort({ parentId: 1, order: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      sections: sections
    });
  } catch (error) {
    console.error('Error getting all sections:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las secciones',
      error: error.message
    });
  }
});

/**
 * POST /doc/section
 * Crear o actualizar una sección
 */
router.post('/section', async (req, res) => {
  try {
    const { id, label, parentId, order, content } = req.body;
    
    if (!id || !label) {
      return res.status(400).json({
        success: false,
        message: 'ID y label son requeridos'
      });
    }
    
    const sectionData = {
      id,
      label,
      parentId: parentId || null,
      order: order || 0,
      content: content || '',
      updatedAt: new Date()
    };
    
    const section = await DocumentationSection.findOneAndUpdate(
      { id: id },
      sectionData,
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    res.status(200).json({
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
 * DELETE /doc/section/:id
 * Eliminar una sección (soft delete)
 */
router.delete('/section/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    res.status(200).json({
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

module.exports = router;
