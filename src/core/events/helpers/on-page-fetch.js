import {of} from "rxjs";
import {mergeMap} from "rxjs/operators";
import MATCHES from "../../../constants/regexp";
import {toPrice} from "../../../utils/lang";
import ITEM_STATUS from "../../../config/item-statuses";
import setStorageDomain$ from "../internal/set-storage-domain";
import StateManager from "../../state-manager";
import createNotification$ from "../create-custom-notification";
import {PRICE_FIX_ICON, PRICE_NOT_FOUND_ICON, PRICE_UPDATE_ICON} from "../../../config/assets";

function onPageFetch(template, domain, url, domainItems, item) {
    const {price: targetPrice, currentPrice} = item;
    try {
        let newPrice = null;
        const {textContent} = template.querySelector(domainItems[url].selection);
        if (textContent) {
            const textContentMatch = textContent.match(MATCHES.PRICE);
            if (textContentMatch) {
                [, newPrice] = textContentMatch;

                newPrice = toPrice(newPrice);

                if (item.price && !newPrice) {
                    if (!item.isNotFound()) {
                        item.updateTrackStatus(null,
                            [ITEM_STATUS.NOT_FOUND],
                            [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);
                        domainItems[url] = item;
                        return setStorageDomain$(domain, domainItems).pipe(
                            mergeMap(() => {
                                // TODO: sendResponse("done"); // foi actualizado ou não
                                const {notificationsCounter} = StateManager.getState();
                                const notificationId = `TRACK.PRICE_NOT_FOUND-${notificationsCounter}`;
                                const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                                return createNotification$(notificationId, PRICE_NOT_FOUND_ICON, "Price gone",
                                    `Price tag no longer found${previousPrice}`, url, url, domain);
                            })
                        );
                    }
                } else if (!targetPrice) {
                    item.updateTrackStatus(newPrice,
                        [ITEM_STATUS.FIXED], [ITEM_STATUS.NOT_FOUND]);
                    domainItems[url] = item;
                    return setStorageDomain$(domain, domainItems).pipe(
                        mergeMap(() => {
                            const {notificationsCounter} = StateManager.getState();
                            const notificationId = `TRACK.PRICE_FIXED-${notificationsCounter}`;
                            return createNotification$(notificationId, PRICE_FIX_ICON, "Fixed price",
                                `Ermm.. We've just fixed a wrongly set price to ${newPrice}`, url, url, domain);
                        })
                    );
                } else if (newPrice < currentPrice) {
                    item.updateCurrentPrice(newPrice);
                    item.updateTrackStatus(null,
                        newPrice === targetPrice ? null : [ITEM_STATUS.DECREASED],
                        [ITEM_STATUS.INCREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_DECREASE]);
                    domainItems[url] = item;

                    return setStorageDomain$(domain, domainItems).pipe(
                        mergeMap(() => {
                            // TODO: sendResponse("done"); // foi actualizado ou não
                            if (newPrice < targetPrice && !item.hasAcknowledgeDecrease()) {
                                const {notificationsCounter} = StateManager.getState();
                                const notificationId = `TRACK.PRICE_UPDATE-${notificationsCounter}`;
                                return createNotification$(notificationId, PRICE_UPDATE_ICON, "Lower price!!",
                                    `${newPrice} (previous ${targetPrice})`, url, url, domain, ITEM_STATUS.DECREASED,
                                    {
                                        buttons: [
                                            {
                                                title: "Stop watching"
                                            },
                                            {
                                                title: `Keep tracking but w/ new price (${newPrice})`
                                            }
                                        ]
                                    });
                            } else {
                                return of();
                            }
                        })
                    );
                } else if (newPrice > currentPrice) {
                    item.updateCurrentPrice(newPrice); // update current price and previous
                    item.updateTrackStatus(null,
                        newPrice === targetPrice ? null : [ITEM_STATUS.INCREASED],
                        [ITEM_STATUS.DECREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_INCREASE]);

                    domainItems[url] = item;
                    return setStorageDomain$(domain, domainItems).pipe(
                        mergeMap(() => {
                            // TODO: sendResponse("done"); // foi actualizado ou não

                            if (!item.hasAcknowledgeIncrease()) {
                                const {notificationsCounter} = StateManager.getState();
                                const notificationId = `TRACK.PRICE_UPDATE-${notificationsCounter}`;
                                const notificationOptions = {
                                    buttons: [
                                        {
                                            title: "Stop watching"
                                        }
                                    ]
                                };
                                if (domainItems[url].price !== domainItems[url].previousPrice) {
                                    notificationOptions.buttons.push(
                                        {
                                            title: `Increase interest price to the previous (${domainItems[url].previousPrice})`
                                        }
                                    );
                                }

                                return createNotification$(notificationId, PRICE_UPDATE_ICON, "Price increase",
                                    `${newPrice} (previous ${domainItems[url].previousPrice})`, url, url, domain, ITEM_STATUS.INCREASED,
                                    notificationOptions);
                            }
                            return of();
                        })
                    );
                } else if (!item.isNotFound()) { // NOTE: Here, price is the same
                    item.updateTrackStatus(null,
                        null, [ITEM_STATUS.NOT_FOUND]);
                    domainItems[url] = item;
                    return setStorageDomain$(domain, domainItems);
                    // TODO: sendResponse("done"); // foi actualizado ou não
                } else {
                    item.updateTrackStatus(null,
                        null, [ITEM_STATUS.NOT_FOUND]);
                    domainItems[url] = item;
                    return setStorageDomain$(domain, domainItems);
                }
            }
        }
    } catch (e) {
        if (!item.isNotFound()) {
            console.warn(`Invalid price selection element in\n${url}:\t"${domainItems[url].selection}"`);
            item.updateTrackStatus(null,
                [ITEM_STATUS.NOT_FOUND],
                [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);
            domainItems[url] = item;

            return setStorageDomain$(domain, domainItems).pipe(
                mergeMap(() => {
                    const {notificationsCounter} = StateManager.getState();
                    const notificationId = `TRACK.PRICE_NOT_FOUND-${notificationsCounter}`;
                    const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                    return createNotification$(notificationId, PRICE_NOT_FOUND_ICON, "Price gone",
                        `Price tag no longer found${previousPrice}`, url, url, domain);
                })
            );
        }

        return of(e);
    }
}

export default onPageFetch;
