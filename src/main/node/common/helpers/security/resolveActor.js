const accountSchema = require('../../../authentication/schemas/accounts');

async function resolveActor({ id, type }) {
  switch (type) {
    case 'business_account': {
      const account = await accountSchema.findById(id).select('names email');
      if (!account) return null;
      return {
        id: account._id.toString(),
        type,
        names: account.names,
        email: account.email
      };
    }

    default:
      throw new Error(`Tipo de actor no soportado: ${type}`);
  }
}

module.exports = { resolveActor };
