const express = require('express');
const router = express.Router();
const Joi = require('joi');
const BugReport = require('../schemas/bugReport');
const File = require('../../files/schemas/file');
const { validateBody } = require('../../common/middlewares/validation');
const { asyncHandler } = require('../../common/middlewares/errorHandler');
const { exceptions } = require('../../common/helpers/exceptions');
const logger = require('../../common/config/logger');
const logObfuscator = require('../../common/helpers/logObfuscator');

function getBrowserInfo(userAgent) {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let version = '';

  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/(\d+\.\d+)/);
    version = match ? match[1] : '';
  }

  return version ? `${browser} ${version}` : browser;
}

// Schema para crear bug report
const createBugReportSchema = Joi.object({
  code: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'El código no puede tener más de 100 caracteres'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .required()
    .messages({
      'string.empty': 'La descripción es requerida',
      'string.max': 'La descripción no puede tener más de 2000 caracteres',
      'any.required': 'La descripción es requerida'
    }),

  screenshots: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(5)
    .required()
    .messages({
      'array.min': 'Se requiere al menos 1 captura de pantalla',
      'array.max': 'No se pueden adjuntar más de 5 capturas de pantalla',
      'string.pattern.base': 'ID de archivo inválido',
      'any.required': 'Las capturas de pantalla son requeridas'
    }),

  category: Joi.string()
    .valid('ui', 'functionality', 'performance', 'security', 'data', 'other')
    .default('other')
    .messages({
      'any.only': 'Categoría inválida'
    }),

  severity: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .default('medium')
    .messages({
      'any.only': 'Severidad inválida'
    }),

  reproductionSteps: Joi.string()
    .trim()
    .max(3000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Los pasos de reproducción no pueden tener más de 3000 caracteres'
    }),

  expectedBehavior: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'El comportamiento esperado no puede tener más de 1000 caracteres'
    }),

  actualBehavior: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'El comportamiento actual no puede tener más de 1000 caracteres'
    }),

  currentUrl: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional(),

  userAgent: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional(),

  browserInfo: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
});

// Schema para listar bug reports
const listBugReportsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  perPage: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10),

  status: Joi.string()
    .valid('pending', 'in-progress', 'resolved', 'closed')
    .optional(),

  priority: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional(),

  category: Joi.string()
    .valid('ui', 'functionality', 'performance', 'security', 'data', 'other')
    .optional(),

  severity: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional(),

  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'La fecha de inicio debe estar en formato ISO (YYYY-MM-DD)',
      'date.base': 'La fecha de inicio debe ser una fecha válida'
    }),

  dateTo: Joi.date()
    .iso()
    .optional()
    .when('dateFrom', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('dateFrom')),
      otherwise: Joi.date()
    })
    .messages({
      'date.format': 'La fecha de fin debe estar en formato ISO (YYYY-MM-DD)',
      'date.base': 'La fecha de fin debe ser una fecha válida',
      'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
    })
});

// Schema para actualizar estado
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'in-progress', 'resolved', 'closed')
    .required()
    .messages({
      'any.only': 'Estado inválido',
      'any.required': 'El estado es requerido'
    })
});

// Schema para agregar comentario
const addCommentSchema = Joi.object({
  comment: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'El comentario es requerido',
      'string.min': 'El comentario no puede estar vacío',
      'string.max': 'El comentario no puede tener más de 1000 caracteres',
      'any.required': 'El comentario es requerido'
    })
});

// POST / - Crear nuevo bug report
router.post("/", validateBody(createBugReportSchema), asyncHandler(async (req, res) => {
  if (!req.account) {
    logger.error({
      msg: 'No account found in request',
      requestId: req.requestId,
      action: 'bug_report_no_account'
    });
    throw exceptions.unauthorized('Usuario no autenticado');
  }

  const { account: accountId, subscription: subscriptionId } = req.account;
  const {
    code,
    description,
    screenshots,
    category = 'other',
    severity = 'medium',
    reproductionSteps,
    expectedBehavior,
    actualBehavior,
    currentUrl,
    userAgent,
    browserInfo
  } = req.body;

  logger.info({
    msg: 'Creating bug report',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      subscriptionId,
      category,
      severity,
      screenshotsCount: screenshots.length
    }),
    action: 'bug_report_create_start'
  });

  // Verificar que las capturas de pantalla existen
  const files = await File.find({ _id: { $in: screenshots } });
  if (files.length !== screenshots.length) {
    logger.warn({
      msg: 'Some screenshot files not found',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({
        accountId,
        requestedFiles: screenshots.length,
        foundFiles: files.length
      }),
      action: 'bug_report_create_files_error'
    });
    throw exceptions.notFound('Algunas capturas de pantalla no fueron encontradas');
  }

  const finalUserAgent = userAgent || req.get('User-Agent') || '';
  const finalBrowserInfo = browserInfo || getBrowserInfo(finalUserAgent);

  const bugReport = new BugReport({
    code: code || undefined,
    description,
    screenshots,
    account: accountId,
    subscription: subscriptionId,
    reportedBy: accountId,
    category,
    severity,
    reproductionSteps,
    expectedBehavior,
    actualBehavior,
    currentUrl,
    userAgent: finalUserAgent,
    browserInfo: finalBrowserInfo,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  });

  await bugReport.save();

  logger.info({
    msg: 'Bug report created successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      subscriptionId,
      bugReportId: bugReport._id,
      category,
      severity
    }),
    action: 'bug_report_create_success'
  });

  res.status(201).json({
    success: true,
    data: {
      id: bugReport._id,
      code: bugReport.code,
      description: bugReport.description,
      category: bugReport.category,
      severity: bugReport.severity,
      status: bugReport.status,
      priority: bugReport.priority,
      createdAt: bugReport.createdAt
    },
    message: 'Reporte de bug creado exitosamente'
  });
}));

// POST /list - Listar bug reports con filtros
router.post("/list", validateBody(listBugReportsSchema), asyncHandler(async (req, res) => {
  const { account: accountId, subscription: subscriptionId } = req.account;
  const { page = 1, perPage = 10, status, priority, category, severity, dateFrom, dateTo } = req.body;

  logger.info({
    msg: 'Getting user bug reports',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      subscriptionId,
      page,
      perPage,
      filters: { status, priority, category, severity, dateFrom, dateTo }
    }),
    action: 'bug_reports_list_start'
  });

  // Construir query - filtrar por account (empresa)
  const query = { account: accountId };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (severity) query.severity = severity;

  // Filtros de fecha
  if (dateFrom || dateTo) {
    query.createdAt = {};

    if (dateFrom) {
      // Inicio del día para dateFrom
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
      query.createdAt.$gte = startDate;
    }

    if (dateTo) {
      // Final del día para dateTo
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }

  const skip = (page - 1) * perPage;

  const [bugReports, totalItems] = await Promise.all([
    BugReport.find(query)
      .populate('screenshots', 'filename mimeType size')
      .populate('reportedBy', 'names email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(perPage)),
    BugReport.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalItems / perPage);

  const data = bugReports.map(report => ({
    id: report._id,
    code: report.code,
    description: report.description,
    status: report.status,
    priority: report.priority,
    severity: report.severity,
    category: report.category,
    assignedTo: report.assignedTo,
    resolution: report.resolution,
    reportedBy: report.reportedBy ? {
      id: report.reportedBy._id,
      name: report.reportedBy.names,
      email: report.reportedBy.email
    } : null,
    screenshots: report.screenshots.map(file => ({
      id: file._id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size
    })),
    commentsCount: (report.comments || []).length,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  }));

  logger.info({
    msg: 'User bug reports retrieved successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      subscriptionId,
      page,
      perPage,
      totalItems
    }),
    action: 'bug_reports_list_success'
  });

  res.json({
    data,
    page: parseInt(page),
    perPage: parseInt(perPage),
    totalItems,
    totalPages
  });
}));

// GET /:id - Obtener detalle de bug report
router.get("/:id", asyncHandler(async (req, res) => {
  const { account: accountId } = req.account;
  const { id } = req.params;

  logger.info({
    msg: 'Getting bug report details',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      bugReportId: id
    }),
    action: 'bug_report_get_start'
  });

  const bugReport = await BugReport.findOne({
    _id: id,
    account: accountId
  })
    .populate('screenshots', 'filename mimeType size')
    .populate('reportedBy', 'names email')
    .populate('comments.author', 'names email');

  if (!bugReport) {
    logger.warn({
      msg: 'Bug report not found',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({
        accountId,
        bugReportId: id
      }),
      action: 'bug_report_get_not_found'
    });
    throw exceptions.notFound('Reporte no encontrado');
  }

  logger.info({
    msg: 'Bug report retrieved successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      bugReportId: id
    }),
    action: 'bug_report_get_success'
  });

  res.json({
    id: bugReport._id,
    code: bugReport.code,
    description: bugReport.description,
    status: bugReport.status,
    priority: bugReport.priority,
    severity: bugReport.severity,
    category: bugReport.category,
    reproductionSteps: bugReport.reproductionSteps,
    expectedBehavior: bugReport.expectedBehavior,
    actualBehavior: bugReport.actualBehavior,
    currentUrl: bugReport.currentUrl,
    userAgent: bugReport.userAgent,
    browserInfo: bugReport.browserInfo,
    environment: bugReport.environment,
    assignedTo: bugReport.assignedTo,
    resolution: bugReport.resolution,
    reportedBy: bugReport.reportedBy ? {
      id: bugReport.reportedBy._id,
      name: bugReport.reportedBy.names,
      email: bugReport.reportedBy.email
    } : null,
    screenshots: bugReport.screenshots.map(file => ({
      id: file._id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size
    })),
    comments: (bugReport.comments || []).map(comment => ({
      id: comment._id,
      text: comment.text,
      author: comment.author ? {
        id: comment.author._id,
        name: comment.author.names,
        email: comment.author.email
      } : null,
      createdAt: comment.createdAt
    })),
    createdAt: bugReport.createdAt,
    updatedAt: bugReport.updatedAt
  });
}));

// PUT /:id/status - Actualizar estado del bug report
router.put("/:id/status", validateBody(updateStatusSchema), asyncHandler(async (req, res) => {
  const { account: accountId } = req.account;
  const { id } = req.params;
  const { status } = req.body;

  logger.info({
    msg: 'Updating bug report status',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      bugReportId: id,
      newStatus: status
    }),
    action: 'bug_report_status_update_start'
  });

  const bugReport = await BugReport.findOneAndUpdate(
    { _id: id, account: accountId },
    {
      status,
      updatedAt: new Date(),
      // Si se marca como resuelto, actualizar la prioridad
      ...(status === 'resolved' && { priority: 'low' })
    },
    { new: true }
  );

  if (!bugReport) {
    logger.warn({
      msg: 'Bug report not found for status update',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({
        accountId,
        bugReportId: id
      }),
      action: 'bug_report_status_update_not_found'
    });
    throw exceptions.notFound('Reporte no encontrado');
  }

  logger.info({
    msg: 'Bug report status updated successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      bugReportId: id,
      newStatus: status
    }),
    action: 'bug_report_status_update_success'
  });

  res.json({
    success: true,
    data: {
      id: bugReport._id,
      status: bugReport.status,
      priority: bugReport.priority,
      updatedAt: bugReport.updatedAt
    },
    message: 'Estado actualizado exitosamente'
  });
}));

// POST /:id/comments - Agregar comentario
router.post("/:id/comments", validateBody(addCommentSchema), asyncHandler(async (req, res) => {
  const { account: accountId } = req.account;
  const { id } = req.params;
  const { comment } = req.body;

  logger.info({
    msg: 'Adding comment to bug report',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      bugReportId: id,
      commentLength: comment.length
    }),
    action: 'bug_report_comment_add_start'
  });

  const bugReport = await BugReport.findOne({
    _id: id,
    account: accountId
  }).populate('reportedBy', '_id names email');

  if (!bugReport) {
    logger.warn({
      msg: 'Bug report not found for comment',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({
        accountId,
        bugReportId: id
      }),
      action: 'bug_report_comment_add_not_found'
    });
    throw exceptions.notFound('Reporte no encontrado');
  }

  // Debug: Log current bug report state
  logger.info({
    msg: 'Bug report found for comment',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      bugReportId: id,
      hasReportedBy: !!bugReport.reportedBy,
      reportedByType: typeof bugReport.reportedBy,
      currentCommentsCount: bugReport.comments ? bugReport.comments.length : 0
    }),
    action: 'bug_report_comment_debug'
  });

  // Agregar el comentario usando findOneAndUpdate para evitar problemas de validación
  const newComment = {
    text: comment.trim(),
    author: accountId,
    createdAt: new Date()
  };

  const updatedBugReport = await BugReport.findOneAndUpdate(
    { _id: id, account: accountId },
    {
      $push: { comments: newComment },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  ).populate('comments.author', 'names email');

  if (!updatedBugReport) {
    logger.warn({
      msg: 'Bug report not found during update',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({
        accountId,
        bugReportId: id
      }),
      action: 'bug_report_comment_update_not_found'
    });
    throw exceptions.notFound('Reporte no encontrado durante la actualización');
  }

  const addedComment = updatedBugReport.comments[updatedBugReport.comments.length - 1];

  logger.info({
    msg: 'Comment added successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({
      accountId,
      bugReportId: id,
      commentId: addedComment._id,
      totalComments: updatedBugReport.comments.length
    }),
    action: 'bug_report_comment_add_success'
  });

  res.json({
    success: true,
    data: {
      id: addedComment._id,
      text: addedComment.text,
      author: addedComment.author ? {
        id: addedComment.author._id,
        name: addedComment.author.names,
        email: addedComment.author.email
      } : null,
      createdAt: addedComment.createdAt
    },
    message: 'Comentario agregado exitosamente'
  });
}));

module.exports = router;
