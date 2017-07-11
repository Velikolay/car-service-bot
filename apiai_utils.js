function getIntentName(response) {
    return response.result.metadata.intentName;
}

function getFillingStation(response) {
    return getEntityValOrEmpty(response.result.parameters.filling_station);
}

function getCarBrand(response) {
    return getEntityValOrEmpty(response.result.parameters.car_brand);
}

function getCarFuelType(response) {
    return getEntityValOrEmpty(response.result.parameters.car_fuel);
}

function getEntityValOrEmpty(entity_val) {
    return entity_val ? entity_val : '';
}

module.exports = { getIntentName, getFillingStation, getCarBrand, getCarFuelType };