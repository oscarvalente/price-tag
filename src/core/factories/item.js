import Item from "../entities/item";

class ItemFactory {
    static createItem(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage) {
        return new Item(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage);
    }

    static createItemFromObject({selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage}) {
        return new Item(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage);
    }
}

export default ItemFactory;
