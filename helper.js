function validateStockName(str) {
    if (typeof str !== 'string' || str.trim().length === 0) {
        return false;
    }
    return true;
}

function validateNumber(val) {
    if (typeof val !== 'number' || Number.isNaN(val)) {
        return false;
    }
    return true;
}

module.exports = {
    validateStockName,
    validateNumber
};
