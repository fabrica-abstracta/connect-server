const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const bugReportSchema = new mongoose.Schema({
  // Código del reporte (opcional, generado por el usuario)
  code: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Descripción del problema (requerido)
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Categoría del problema
  category: {
    type: String,
    required: true,
    enum: ['ui', 'functionality', 'performance', 'security', 'data', 'other'],
    default: 'other'
  },
  
  // Severidad del problema
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Estado del reporte (inicia como pendiente)
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'in-progress', 'resolved', 'closed']
  },
  
  // Prioridad (para uso interno)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Pasos para reproducir (opcional)
  reproductionSteps: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  
  // Comportamiento esperado (opcional)
  expectedBehavior: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Comportamiento actual (opcional)
  actualBehavior: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Información técnica automática
  userAgent: {
    type: String,
    trim: true
  },
  
  browserInfo: {
    type: String,
    trim: true
  },
  
  currentUrl: {
    type: String,
    trim: true
  },
  
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'production'
  },
  
  // Capturas de pantalla (requerido mínimo 1)
  screenshots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }],
  
  // Usuario que reportó el bug
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  
  // Cuenta de la empresa
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  
  // Suscripción de la empresa
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  
  // Campos administrativos (para uso interno)
  assignedTo: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  resolution: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Comentarios del reporte
  comments: [commentSchema]
}, {
  timestamps: true
});

// Indexes for better performance
bugReportSchema.index({ account: 1, createdAt: -1 });
bugReportSchema.index({ subscription: 1, createdAt: -1 });
bugReportSchema.index({ reportedBy: 1, createdAt: -1 });
bugReportSchema.index({ status: 1 });
bugReportSchema.index({ category: 1 });
bugReportSchema.index({ severity: 1 });
bugReportSchema.index({ priority: 1 });

// Crear y exportar el modelo
const BugReport = mongoose.model('BugReport', bugReportSchema);
module.exports = BugReport;
