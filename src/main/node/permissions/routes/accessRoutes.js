const express = require('express');
const router = express.Router();
const Store = require('../../inventory/schemas/store');

router.post('/access', async (req, res) => {
  const { type, employeeEmail } = req.body;
  const { account, subscription } = req.account || {};

  try {
    // Si hay email de empleado, obtener acceso basado en sus permisos
    if (employeeEmail && account && subscription) {
      const employee = await StoreEmployee.findOne({
        email: employeeEmail,
        account,
        subscription,
        isActive: true
      }).populate('role').populate('store');

      if (employee && employee.role) {
        const accessibleModules = employee.role.getAccessibleModules();
        const navigationConfig = buildNavigationFromPermissions(accessibleModules, type);
        return res.json(navigationConfig);
      }
    }

    // Configuración por defecto (propietario o sin autenticación)
    const accessConfig = {
      'barra de herramientas': [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'dashboard',
        },
        {
          name: 'Inventario',
          path: '/inventory',
          icon: 'inventory',
        },
        {
          name: 'Reportes',
          path: '/reports',
          icon: 'analytics',
        },
        {
          name: 'Configuración',
          path: '/settings',
          icon: 'settings',
        }
      ],
      'menu lateral': [
        {
          name: 'Productos',
          path: '/products',
          icon: 'product',
        },
        {
          name: 'Categorías',
          path: '/categories',
          icon: 'category',
        },
        {
          name: 'Proveedores',
          path: '/suppliers',
          icon: 'supplier',
        }
      ],
      'acciones rapidas': [
        {
          name: 'Nuevo Producto',
          path: '/products/new',
          icon: 'add',
        },
        {
          name: 'Nueva Venta',
          path: '/sales/new',
          icon: 'sell',
        },
        {
          name: 'Reporte Rápido',
          path: '/reports/quick',
          icon: 'report',
        }
      ],
      'modules': [
        {
          name: 'Inventario',
          path: '/inventory',
          icon: 'inventory',
        }
      ],
      'settings': {
        account: {
          available: true,
          items: ['profile', 'online-store', 'employee']
        },
        'organize-your-place': {
          available: true,
          items: ['company', 'place', 'level', 'space']
        },
        warehouse: {
          available: false,
          items: ['warehouse', 'shelf']
        },
        'roles-permissions': {
          available: true,
          items: ['role']
        }
      }
    };

    res.json(accessConfig[type] || []);
    
  } catch (error) {
    console.error('Error in access route:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función auxiliar para construir navegación basada en permisos
function buildNavigationFromPermissions(accessibleModules, type) {
  const moduleMap = {
    'inventory': {
      toolbar: { name: 'Inventario', path: '/inventory', icon: 'inventory' },
      sidebar: [
        { name: 'Productos', path: '/products', icon: 'product' },
        { name: 'Categorías', path: '/categories', icon: 'category' },
        { name: 'Stock', path: '/stock', icon: 'storage' }
      ],
      actions: { name: 'Nuevo Producto', path: '/products/new', icon: 'add' }
    },
    'sales': {
      toolbar: { name: 'Ventas', path: '/sales', icon: 'sell' },
      sidebar: [
        { name: 'Órdenes', path: '/sales/orders', icon: 'order' },
        { name: 'Facturación', path: '/sales/invoices', icon: 'invoice' }
      ],
      actions: { name: 'Nueva Venta', path: '/sales/new', icon: 'sell' }
    },
    'customers': {
      sidebar: [
        { name: 'Clientes', path: '/customers', icon: 'customer' }
      ]
    },
    'suppliers': {
      sidebar: [
        { name: 'Proveedores', path: '/suppliers', icon: 'supplier' }
      ]
    },
    'purchases': {
      toolbar: { name: 'Compras', path: '/purchases', icon: 'purchase' },
      sidebar: [
        { name: 'Órdenes de Compra', path: '/purchases/orders', icon: 'purchase_order' }
      ]
    },
    'reports': {
      toolbar: { name: 'Reportes', path: '/reports', icon: 'analytics' },
      actions: { name: 'Reporte Rápido', path: '/reports/quick', icon: 'report' }
    },
    'analytics': {
      toolbar: { name: 'Analytics', path: '/analytics', icon: 'chart' }
    },
    'users': {
      toolbar: { name: 'Usuarios', path: '/users', icon: 'users' },
      sidebar: [
        { name: 'Empleados', path: '/employees', icon: 'employee' },
        { name: 'Roles', path: '/roles', icon: 'role' }
      ]
    }
  };

  const result = [];
  
  accessibleModules.forEach(({ moduleCode, scopes }) => {
    const moduleConfig = moduleMap[moduleCode];
    if (!moduleConfig) return;

    // Solo incluir si tiene al menos permisos de lectura
    if (!scopes.read) return;

    switch (type) {
      case 'barra de herramientas':
        if (moduleConfig.toolbar) {
          result.push(moduleConfig.toolbar);
        }
        break;
      case 'menu lateral':
        if (moduleConfig.sidebar) {
          result.push(...moduleConfig.sidebar);
        }
        break;
      case 'acciones rapidas':
        if (moduleConfig.actions && scopes.write) {
          result.push(moduleConfig.actions);
        }
        break;
    }
  });

  // Siempre incluir Dashboard
  if (type === 'barra de herramientas' && !result.find(item => item.path === '/dashboard')) {
    result.unshift({ name: 'Dashboard', path: '/dashboard', icon: 'dashboard' });
  }

  return result;
}

module.exports = router;
