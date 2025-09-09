const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const AppPlan = require('../schemas/plan');

const getPlan = async (planCode) => {
  if (!planCode) throw new Error('Plan code required');

  logger.info('Getting plan', { planCode });

  try {
    const yamlPath = path.join(__dirname, '../../../resources/plans.yml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const yamlData = yaml.load(fileContents);

    if (yamlData.plans && yamlData.plans[planCode]) {
      const plan = yamlData.plans[planCode];
      return {
        code: planCode,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billing_period,
        trialDays: plan.trial?.days,
        limits: plan.limits,
        modules: plan.modules,
        features: plan.features
      };
    }
  } catch (error) {
    logger.warn('YAML read failed', { error: error.message });
  }

  try {
    const dbPlan = await AppPlan.findOne({ code: planCode, isActive: true });
    if (dbPlan) {
      logger.info('Plan found in DB', { planCode });
      return dbPlan.toObject();
    }
  } catch (error) {
    logger.warn('DB query failed', { error: error.message });
  }

  logger.error('Plan not found', { planCode });
  throw new Error('Plan not found');
};

module.exports = {
  getPlan
};
