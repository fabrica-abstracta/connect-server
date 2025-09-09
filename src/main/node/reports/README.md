# Módulo de Reportes

Este módulo maneja los reportes y resúmenes del dashboard de la aplicación.

## Estructura

```
reports/
├── index.js                    # Exportación del módulo
├── routes/
│   └── reportRoutes.js        # Rutas de APIs de reportes
├── helpers/
│   └── summaryHelper.js       # Lógica de negocio para resúmenes
└── README.md                  # Esta documentación
```

## APIs Disponibles

### GET /account-summary
Obtiene el resumen de la cuenta del usuario autenticado.

**Respuesta:**
```json
{
  "title": "Bienvenido, Juan Pérez",
  "description": "Resumen general de tu cuenta",
  "cards": [
    {
      "label": "Plan Actual",
      "value": "Básico"
    },
    {
      "label": "Estado Suscripción",
      "value": "Activa"
    },
    {
      "label": "Días Restantes",
      "value": 30
    },
    {
      "label": "Días Registrado", 
      "value": 15
    }
  ]
}
```

### GET /sales-summary
Obtiene resumen de ventas por período.

**Query Parameters:**
- `period`: 'day', 'week', 'month', 'year' (default: 'month')

### GET /inventory-summary
Obtiene resumen del estado del inventario.

## Estructura de Respuesta

Todas las APIs de resumen siguen esta estructura:

```typescript
interface SummaryResponse {
  title: string;
  description?: string;
  cards: SummaryCardItem[];
}

interface SummaryCardItem {
  label: string;
  value: string | number;
}
```

## Helpers Disponibles

### summaryHelper.js

- **getAccountSummary(accountId, storeId)**: Genera resumen de cuenta
- **getActivitySummary(accountId)**: Genera resumen de actividad reciente  
- **getFinancialMetrics(storeId)**: Genera métricas financieras

## Integración con Frontend

### Welcome.tsx
```tsx
<Summary
  apiPath="account-summary"
  title={`Hola, ${userName} 👋`}
  description="Resumen general de tu cuenta"
  columns={4}
/>
```

### Summary.tsx
El componente Summary hace llamadas automáticas a las APIs y renderiza las tarjetas con:
- Loading states con skeletons
- Manejo de errores
- Refresh automático configurable
- Diseño responsive

## Datos Mostrados

### Account Summary
- Plan actual y estado de suscripción
- Días restantes y días registrado
- Información de tienda y sector
- Email y estado de cuenta

### Sales Summary (Futuro)
- Ventas totales del período
- Número de órdenes
- Productos vendidos
- Ticket promedio

### Inventory Summary (Futuro)
- Total de productos
- Stock bajo y sin stock
- Valor total del inventario

## Notas de Implementación

1. **Autenticación**: Todas las rutas requieren autenticación
2. **Logging**: Se registran todas las operaciones importantes
3. **Error Handling**: Manejo robusto de errores con fallbacks
4. **Performance**: Consultas optimizadas y caché cuando sea necesario
5. **Extensibilidad**: Estructura preparada para agregar más tipos de reportes

## TODOs

- [ ] Implementar consultas reales a tablas de ventas
- [ ] Agregar métricas de inventario dinámicas  
- [ ] Implementar caché para mejorar performance
- [ ] Agregar más tipos de reportes (financiero, productos, etc.)
- [ ] Implementar filtros por fecha y otras dimensiones
