function getIntentName(response) {
  return response.result.metadata.intentName;
}

function getEntityValOrEmpty(entityVal) {
  return entityVal || '';
}

function getFillingStation(response) {
  return getEntityValOrEmpty(response.result.parameters.filling_station);
}

function getCarBrand(response) {
  return getEntityValOrEmpty(response.result.parameters.car_brand);
}

module.exports = { getIntentName, getFillingStation, getCarBrand };
