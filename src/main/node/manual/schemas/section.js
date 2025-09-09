const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  label: {
    type: String,
    required: true
  },
  parentId: {
    type: String,
    default: null,
    index: true
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  content: {
    type: String,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'documentation_sections'
});

// Índices compuestos para mejorar rendimiento
sectionSchema.index({ parentId: 1, order: 1 });
sectionSchema.index({ isActive: 1, parentId: 1, order: 1 });

// Middleware para actualizar updatedAt
sectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método estático para obtener la estructura jerárquica
sectionSchema.statics.getHierarchy = async function() {
  const sections = await this.find({ isActive: true })
    .sort({ parentId: 1, order: 1 })
    .lean();
  
  const buildTree = (parentId = null) => {
    return sections
      .filter(section => section.parentId === parentId)
      .map(section => ({
        id: section.id,
        label: section.label,
        children: buildTree(section.id)
      }))
      .filter(section => section.id || section.children.length > 0);
  };
  
  return buildTree();
};

module.exports = mongoose.model('DocumentationSection', sectionSchema);
