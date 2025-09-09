const express = require("express");
const router = express.Router();
const authMiddleware = require('../../common/middlewares/authentication');
const { asyncHandler } = require('../../common/middlewares/errorHandler');
const { validateBody } = require('../../common/middlewares/validation');
const Payment = require('../schemas/payment');
const SaasSubscription = require('../../subscription/schemas/subscription');
const File = require('../../files/schemas/file');
const { exceptions } = require('../../common/helpers/exceptions');
const logger = require('../../common/config/logger');
const logObfuscator = require('../../common/helpers/logObfuscator');
const Joi = require('joi');

const registerPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('PEN', 'USD', 'EUR').default('PEN'),
  paymentMethod: Joi.string().valid('bank_transfer', 'cash', 'mobile_payment', 'other').default('bank_transfer'),
  evidenceImageId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  transactionId: Joi.string().max(100).trim().optional(),
  description: Joi.string().max(500).optional()
}).custom((value, helpers) => {
  if (!value.evidenceImageId && !value.transactionId) {
    return helpers.error('custom.oneRequired');
  }
  return value;
}).messages({
  'custom.oneRequired': 'Either evidenceImageId or transactionId is required'
});

router.post("/register", authMiddleware, validateBody(registerPaymentSchema), asyncHandler(async (req, res) => {
  const { amount, currency, paymentMethod, evidenceImageId, transactionId, description } = req.body;
  const { subscription: subscriptionId } = req.account;

  logger.info({
    msg: 'Payment registration started',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({ 
      subscriptionId,
      amount,
      currency,
      paymentMethod,
      evidenceImageId,
      transactionId
    }),
    action: 'payment_register_start'
  });

  // Verificar que la suscripción existe
  const subscription = await SaasSubscription.findById(subscriptionId);
  if (!subscription) {
    throw exceptions.notFound('Subscription not found');
  }

  // Verificar que la imagen de evidencia existe si se proporciona
  if (evidenceImageId) {
    const evidenceImage = await File.findById(evidenceImageId);
    if (!evidenceImage) {
      throw exceptions.notFound('Evidence image not found');
    }
    if (!evidenceImage.mimeType.startsWith('image/')) {
      throw exceptions.validation('Evidence file must be an image');
    }
  }

  const payment = await Payment.create({
    subscription: subscriptionId,
    amount,
    currency,
    paymentMethod,
    evidenceImage: evidenceImageId || undefined,
    transactionId,
    description,
    status: 'pending'
  });

  // Actualizar estado de suscripción a "processing" si está expirada
  if (subscription.status === 'expired' || subscription.status === 'trial') {
    subscription.status = 'processing';
    await subscription.save();
    
    logger.info({
      msg: 'Subscription status updated to processing',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({ subscriptionId }),
      action: 'subscription_status_processing'
    });
  }

  logger.info({
    msg: 'Payment registered successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({ 
      subscriptionId,
      paymentId: payment._id,
      amount,
      currency
    }),
    action: 'payment_register_success'
  });

  res.status(201).json({
    id: payment._id,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    description: payment.description,
    transactionId: payment.transactionId,
    createdAt: payment.createdAt
  });
}));

router.get("/summary", authMiddleware, asyncHandler(async (req, res) => {
  const { subscription: subscriptionId } = req.account;

  logger.info({
    msg: 'Getting payment summary',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({ subscriptionId }),
    action: 'payment_summary_start'
  });

  // Obtener estadísticas de pagos
  const [totalPayments, pendingPayments, approvedPayments, rejectedPayments, totalAmount] = await Promise.all([
    Payment.countDocuments({ subscription: subscriptionId }),
    Payment.countDocuments({ subscription: subscriptionId, status: 'pending' }),
    Payment.countDocuments({ subscription: subscriptionId, status: 'approved' }),
    Payment.countDocuments({ subscription: subscriptionId, status: 'rejected' }),
    Payment.aggregate([
      { $match: { subscription: subscriptionId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalApprovedAmount = totalAmount.length > 0 ? totalAmount[0].total : 0;

  const summary = [
    {
      label: "Total de Pagos",
      value: totalPayments.toString(),
      extra: "Todos los registros"
    },
    {
      label: "Pagos Pendientes", 
      value: pendingPayments.toString(),
      extra: "En proceso de validación"
    },
    {
      label: "Pagos Aprobados",
      value: approvedPayments.toString(),
      extra: "Validados correctamente"
    },
    {
      label: "Monto Total Aprobado",
      value: `S/ ${totalApprovedAmount.toFixed(2)}`,
      extra: "Soles peruanos"
    }
  ];

  logger.info({
    msg: 'Payment summary retrieved successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({ 
      subscriptionId,
      totalPayments,
      pendingPayments,
      approvedPayments
    }),
    action: 'payment_summary_success'
  });

  res.json(summary);
}));

const paymentSummarySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  perPage: Joi.number().integer().min(1).max(100).default(10)
});

router.post("/", authMiddleware, validateBody(paymentSummarySchema), asyncHandler(async (req, res) => {
  const { subscription: subscriptionId } = req.account;
  const { page, perPage } = req.body;

  logger.info({
    msg: 'Getting payment table data',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({ 
      subscriptionId,
      page,
      perPage
    }),
    action: 'payment_table_start'
  });

  const skip = (page - 1) * perPage;
  
  const [payments, totalItems] = await Promise.all([
    Payment.find({ subscription: subscriptionId })
      .populate('evidenceImage', 'filename mimeType size')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(perPage)),
    Payment.countDocuments({ subscription: subscriptionId })
  ]);

  const totalPages = Math.ceil(totalItems / perPage);

  // Formatear datos para la tabla
  const data = payments.map(payment => {
    const statusMap = {
      'pending': { text: 'Pendiente', color: 'warning' },
      'processing': { text: 'Procesando', color: 'info' },
      'approved': { text: 'Aprobado', color: 'success' },
      'rejected': { text: 'Rechazado', color: 'danger' }
    };

    const methodMap = {
      'bank_transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo',
      'mobile_payment': 'Pago Móvil',
      'other': 'Otro'
    };

    return {
      id: payment._id,
      date: payment.createdAt.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      amount: `${payment.currency} ${payment.amount.toFixed(2)}`,
      method: methodMap[payment.paymentMethod] || payment.paymentMethod,
      status: {
        text: statusMap[payment.status]?.text || payment.status,
        color: statusMap[payment.status]?.color || 'secondary'
      },
      transactionId: payment.transactionId || 'N/A',
      action: {
        canView: !!payment.evidenceImage,
        evidenceImageId: payment.evidenceImage?._id,
        paymentId: payment._id
      }
    };
  });

  logger.info({
    msg: 'Payment table data retrieved successfully',
    requestId: req.requestId,
    data: logObfuscator.obfuscate({ 
      subscriptionId,
      page,
      perPage,
      totalItems
    }),
    action: 'payment_table_success'
  });

  res.json({
    data,
    pagination: {
      page: parseInt(page),
      perPage: parseInt(perPage),
      total: totalItems,
      pages: totalPages
    }
  });
}));

module.exports = router;
