const express = require('express');
const router = express.Router();
const authentication = require('../../common/middlewares/authentication');
const { asyncHandler } = require('../../common/middlewares/errorHandler');
const { getAccountSummary } = require('../helpers/summaryHelper');
const logger = require('../../common/config/logger');
const logObfuscator = require('../../common/helpers/logObfuscator');

/**
 * GET /account-summary
 * Obtener resumen de la cuenta del usuario autenticado
 */
router.get('/account-summary', authentication, asyncHandler(async (req, res) => {
  try {
    const accountId = req.account.account;
    const storeId = req.account.store;
    
    logger.info({
      msg: 'Account summary request started',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({ accountId, storeId }),
      action: 'account_summary_start'
    });

    const summaryData = await getAccountSummary(accountId, storeId);

    logger.info({
      msg: 'Account summary generated successfully',
      requestId: req.requestId,
      data: logObfuscator.obfuscate({ 
        accountId, 
        storeId,
        cardsCount: summaryData.cards.length 
      }),
      action: 'account_summary_success'
    });

    res.status(200).json(summaryData);
  } catch (error) {
    logger.error({
      msg: 'Account summary failed',
      requestId: req.requestId,
      error: error.message,
      action: 'account_summary_error'
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de la cuenta',
      error: error.message
    });
  }
}));

/**
 * GET /sales-summary
 * Obtener resumen de ventas
 */
router.get('/sales-summary', authentication, asyncHandler(async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const storeId = req.account.store;
    
    // Aquí implementarías la lógica de resumen de ventas
    const salesSummary = {
      title: "Resumen de Ventas",
      description: `Datos de ventas del ${period}`,
      cards: [
        { label: "Ventas Totales", value: "$1,234.56" },
        { label: "Órdenes", value: 45 },
        { label: "Productos Vendidos", value: 123 },
        { label: "Ticket Promedio", value: "$27.43" }
      ]
    };

    res.status(200).json(salesSummary);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de ventas',
      error: error.message
    });
  }
}));

/**
 * GET /inventory-summary
 * Obtener resumen de inventario
 */
router.get('/inventory-summary', authentication, asyncHandler(async (req, res) => {
  try {
    const storeId = req.account.store;
    
    // Aquí implementarías la lógica de resumen de inventario
    const inventorySummary = {
      title: "Resumen de Inventario",
      description: "Estado actual del inventario",
      cards: [
        { label: "Total Productos", value: 256 },
        { label: "Stock Bajo", value: 12 },
        { label: "Sin Stock", value: 3 },
        { label: "Valor Inventario", value: "$15,678.90" }
      ]
    };

    res.status(200).json(inventorySummary);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de inventario',
      error: error.message
    });
  }
}));

module.exports = router;
