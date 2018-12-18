import Item from "../entities/item";

class ItemFactory {
    static createItem(selection, price, previousPrice, faviconURL, name, statuses, diffPercentage) {
        return new Item(selection, price, previousPrice, faviconURL, name, statuses, diffPercentage);
    }

    static createItemFromObject({selection, price, previousPrice, faviconURL, name, statuses, diffPercentage,
                                    currentPrice, timestamp, lastUpdateTimestamp}) {
        return new Item(selection, price, previousPrice, faviconURL, name, statuses, diffPercentage, currentPrice,
            timestamp, lastUpdateTimestamp);
    }
}

export default ItemFactory;
