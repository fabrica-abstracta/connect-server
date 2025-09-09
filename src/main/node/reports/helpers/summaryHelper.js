const Account = require('../../authentication/schemas/account');
const Store = require('../../inventory/schemas/store');
const SaasSubscription = require('../../subscription/schemas/subscription');

/**
 * Obtener resumen completo de la cuenta
 * @param {string} accountId - ID de la cuenta
 * @param {string} storeId - ID de la tienda
 * @returns {Object} Datos del resumen
 */
async function getAccountSummary(accountId, storeId) {
  try {
    // Obtener datos básicos de la cuenta
    const account = await Account.findById(accountId).select('names email createdAt');
    const store = await Store.findById(storeId).select('name business createdAt');
    const subscription = await SaasSubscription.findOne({ 
      // Aquí deberías tener la lógica para encontrar la suscripción correcta
      status: { $in: ['active', 'trial'] }
    }).select('plan status expiresAt');

    // Calcular días desde registro
    const daysSinceRegistration = Math.floor(
      (new Date() - new Date(account.createdAt)) / (1000 * 60 * 60 * 24)
    );

    // Calcular días restantes de suscripción
    let daysRemaining = 'Ilimitado';
    if (subscription && subscription.expiresAt) {
      const remaining = Math.floor(
        (new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
      );
      daysRemaining = remaining > 0 ? remaining : 0;
    }

    // Aquí puedes agregar más consultas para obtener datos reales
    // Por ejemplo: número de productos, ventas del mes, etc.
    
    const cards = [
      {
        label: "Plan Actual",
        value: subscription?.plan || 'Básico'
      },
      {
        label: "Estado Suscripción", 
        value: subscription?.status === 'active' ? 'Activa' : 
               subscription?.status === 'trial' ? 'Prueba' : 'Inactiva'
      },
      {
        label: "Días Restantes",
        value: daysRemaining
      },
      {
        label: "Días Registrado",
        value: daysSinceRegistration
      },
      {
        label: "Tienda",
        value: store?.name || 'Mi Tienda'
      },
      {
        label: "Sector",
        value: store?.business?.sector || 'General'
      },
      {
        label: "Email",
        value: account?.email || 'No disponible'
      },
      {
        label: "Estado Cuenta",
        value: "Activa"
      }
    ];

    return {
      title: `Bienvenido, ${account?.names || 'Usuario'}`,
      description: "Resumen general de tu cuenta",
      cards: cards
    };

  } catch (error) {
    console.error('Error generating account summary:', error);
    
    // Devolver datos básicos en caso de error
    return {
      title: "Resumen de Cuenta",
      description: "Resumen general de tu cuenta", 
      cards: [
        { label: "Plan", value: "Básico" },
        { label: "Estado", value: "Activa" },
        { label: "Días Restantes", value: "30" },
        { label: "Productos", value: "0" }
      ]
    };
  }
}

/**
 * Obtener resumen de actividad reciente
 * @param {string} accountId - ID de la cuenta
 * @returns {Object} Datos de actividad
 */
async function getActivitySummary(accountId) {
  try {
    // Aquí implementarías la lógica para obtener:
    // - Últimas ventas
    // - Productos agregados recientemente
    // - Movimientos de inventario
    // - etc.
    
    return {
      title: "Actividad Reciente",
      description: "Resumen de actividad de los últimos 7 días",
      cards: [
        { label: "Ventas Esta Semana", value: 0 },
        { label: "Nuevos Productos", value: 0 },
        { label: "Órdenes Pendientes", value: 0 },
        { label: "Visitas Tienda", value: 0 }
      ]
    };
  } catch (error) {
    console.error('Error generating activity summary:', error);
    throw error;
  }
}

/**
 * Obtener métricas financieras
 * @param {string} storeId - ID de la tienda
 * @returns {Object} Métricas financieras
 */
async function getFinancialMetrics(storeId) {
  try {
    // Aquí implementarías consultas a:
    // - Tabla de ventas/facturas
    // - Tabla de gastos
    // - Cálculos de rentabilidad
    
    return {
      title: "Métricas Financieras",
      description: "Estado financiero del negocio",
      cards: [
        { label: "Ingresos Mes", value: "$0.00" },
        { label: "Gastos Mes", value: "$0.00" },
        { label: "Ganancia Neta", value: "$0.00" },
        { label: "Margen Promedio", value: "0%" }
      ]
    };
  } catch (error) {
    console.error('Error generating financial metrics:', error);
    throw error;
  }
}

module.exports = {
  getAccountSummary,
  getActivitySummary,
  getFinancialMetrics
};
