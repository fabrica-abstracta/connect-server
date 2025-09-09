# Manual Rápido - Connect Server (MVP)

## 1. Seguridad y Autenticación

- El token se guarda como cookie y se valida automáticamente en todas las rutas protegidas desde el server.js, salvo en casos particulares que se consuma directo en el endpoint enviando como parametro `authentication`.

- El middleware de autenticación se aplica globalmente en `server.js`:

```js
app.use("/", require("./authentication/index")); // rutas públicas
app.use("/", authentication, require("./inventory/routes/index")); // rutas protegidas
```

## 2. Payload del Token (req.account)

El token contiene solo lo esencial:

```json
{
  "session": "<ID>",
  "account": {
    "id": "<ID>",
    "type": "business_account", // importante para la auditoria
    "names": "<Nombres>",
    "email": "<Email>"
  },
  "store": "<ID>",
  "subscription": "<ID>" // opcional
}
```

Acceso rápido en endpoints:

```js
const { store, account } = req.account;
```

## 3. Validación y Errores

- Usa Joi y los middlewares: `validateBody`, `validateParams`, `validateQuery`.
- Lanza errores con el helper `exceptions` (ej: `throw exceptions.unauthorized()`).
- El middleware global responde con el formato adecuado.

## 4. Auditoría y Utilidades

### Auditoría automática con resolveActor

- Para cada acción de creación o actualización, se debe auditar el usuario responsable usando los datos del token (`req.account`).
- **No guardes el resultado completo de `resolveActor(account)` en los campos de auditoría** si el schema solo acepta `{ id, type }`.
- Guarda únicamente `{ id: account.id, type: account.type }` en los campos `createdBy` y `updatedBy`:

```js
const { store, account } = req.account;
const actor = { id: account.id, type: account.type };
// Ejemplo de uso en creación:
const doc = new Modelo({
  ...campos,
  store,
  createdBy: actor,
  updatedBy: actor,
});
```

- El resultado en la base de datos será:

```json
{
  "createdBy": {
    "id": "<ID>",
    "type": "business_account"
  },
  "updatedBy": {
    "id": "<ID>",
    "type": "business_account"
  }
}
```

- Si el tipo de actor no es soportado, se lanzará un error.

- Si el schema de auditoría requiere más campos, ajusta el objeto `actor` según corresponda.

- Esto permite trazabilidad y auditoría en todos los recursos del sistema.

- Helpers útiles adicionales: `formatDate(date)`, `sendRecoveryEmail(to, code)`.

## 5. Estructura de Endpoints

- CRUD: `POST /create-[recurso]`, `PUT /update-[recurso]`, `GET /detail-[recurso]/:id`, `DELETE /delete-[recurso]/:id`, `POST /pagination-[recurso]`.
- Siempre valida y audita.

## 6. Ejemplo Minimal

```js
router.post("/create-ejemplo", validateBody(schema), async (req, res) => {
  const { store, account } = req.account;
  if (!store) throw exceptions.unauthorized();
  // lógica...
});
```
