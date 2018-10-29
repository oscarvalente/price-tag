import uniq from "lodash/uniq";

import ITEM_STATUS from "../../config/item-statuses";

class Item {
    constructor(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage = 0) {
        this.selection = selection;
        this.price = price;
        this.currentPrice = price;
        this.startingPrice = price;
        this.previousPrice = !previousPrice ? null : previousPrice;
        this.faviconURL = faviconURL;
        this.faviconAlt = faviconAlt;
        this.timestamp = new Date().getTime();
        this.lastUpdateTimestamp = new Date().getTime();
        this.statuses = statuses;
        this.diffPercentage = diffPercentage;
    }

    updateCurrentPrice(newPrice) {
        this.previousPrice = this.currentPrice;
        this.currentPrice = newPrice;

        return this.updateDiffPercentage();
    }

    updateDiffPercentage() {
        const diff = Math.abs(this.currentPrice - this.price) * 100 / this.price;
        const diffPerc = parseFloat(diff.toFixed(2));
        let diffPercentage = null;
        if (diffPerc) {
            diffPercentage = this.currentPrice > this.price ?
                +diffPerc :
                -diffPerc;

            if (diffPercentage > 0 && diffPercentage < 1) {
                diffPercentage = Math.ceil(diffPercentage);
            } else if (diffPercentage > -1 && diffPercentage < 0) {
                diffPercentage = Math.floor(diffPercentage);
            }
        }

        this.diffPercentage = diffPercentage;
    }

    updateTrackStatus(item, newPrice, statusesToAdd, statusesToRemove, forceStartingPrice = false) {
        if (!statusesToAdd) {
            statusesToAdd = [];
        }

        if (!statusesToRemove) {
            statusesToRemove = [];
        }

        this.statuses = uniq([...this.removeStatuses(statusesToRemove), ...statusesToAdd]);
        this.lastUpdateTimestamp = new Date().getTime();

        if (forceStartingPrice) {
            this.startingPrice = this.price;
        }

        if (newPrice) {
            this.price = newPrice;
        }
    }

    removeStatuses(statusesToRemove = []) {
        return statusesToRemove.length > 0 && this.statuses.length > 0 ?
            this.statuses.filter(status => !statusesToRemove.includes(status)) :
            this.statuses;
    }

    isWatched() {
        return this.statuses.includes(ITEM_STATUS.WATCHED);
    }

    isNotFound() {
        return this.statuses.includes(ITEM_STATUS.NOT_FOUND);
    }

    hasAcknowledgeDecrease() {
        return this.statuses.includes(ITEM_STATUS.ACK_DECREASE);
    }

    hasAcknowledgeIncrease() {
        return this.statuses.includes(ITEM_STATUS.ACK_INCREASE);
    }
}

export default Item;
