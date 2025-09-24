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

const getCurrentPrice = (stockSymbol) => {
  const prices = { AAPL: 105, GOOG: 210, MSFT: 155, TSLA: 310 };
  return prices[stockSymbol] || 0;
};


module.exports = {
    validateStockName,
    validateNumber,
    getCurrentPrice
};
