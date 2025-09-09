const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function getYamlData(fileName) {
  try {
    const filePath = path.join(__dirname, '../../../resources', fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents);
    logger.info(`Datos cargados de ${fileName} correctamente`);
    return data;
  } catch (err) {
    console.error(`Error leyendo ${fileName}:`, err.message);
    return null;
  }
}

function getSectors() {
  return getYamlData('sectors.yml');
}

function getSector(sectorKey) {
  const sectorsData = getSectors();
  if (!sectorsData || !sectorsData.sectors) return {};
  return sectorsData.sectors[sectorKey] || {};
}

function getPlans() {
  return getYamlData('plans.yml');
}

function getFeatures() {
  return getYamlData('features.yml');
}

function getModules() {
  return getYamlData('modules.yml');
}

function getUnitsOfMeasure() {
  return getYamlData('units-of-measure.yml');
}

function getSectorTerminology(sectorKey) {
  const sectorsData = getSectors();
  if (!sectorsData || !sectorsData.sectors) return {};
  const sector = sectorsData.sectors[sectorKey];
  return sector && sector.terminology ? sector.terminology : {};
}

module.exports = {
  getSectors,
  getPlans,
  getFeatures,
  getModules,
  getUnitsOfMeasure,
  getSectorTerminology,
  getSector
};
