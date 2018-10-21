function sortItemsByTime({timestamp: tsA}, {timestamp: tsB}) {
    return tsA - tsB;
}

function sortItemsByCurrentPrice({currentPrice: cpA}, {currentPrice: cpB}) {
    return cpA - cpB;
}

export default {
    TIME: sortItemsByTime,
    CURRENT_PRICE: sortItemsByCurrentPrice
};
