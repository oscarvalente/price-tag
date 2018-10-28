import uniq from "lodash/uniq";
import * as SORT_BY_TYPES from "./src/config/sort-tracked-items";
import {TIME as SORT_ITEMS_BY_TIME} from "./src/config/sort-tracked-items";
import {PRICE_CHECKING_INTERVAL, SYNCHING_INTERVAL, MAX_UNDO_REMOVED_ITEMS, UNDO_REMOVED_ITEMS_TIMEOUT}
    from "./src/config/background";
import StateFactory from "./src/core/factories/state";
import Item from "./src/core/entities/item";
import sortTrackedItemsBy from "./src/utils/sort-tracked-items";
import {createHTMLTemplate, getCanonicalPathFromSource} from "./src/utils/dom";
import {toPrice} from "./src/utils/lang";

let State = StateFactory.createState(SORT_ITEMS_BY_TIME);

const DEFAULT_ICON = "assets/icon_48.png";
const TRACKED_ITEM_ICON = "assets/icon_active_48.png";
const DEFAULT_TITLE = "Price Tag";
const TRACKED_ITEM_TITLE = "Price Tag - This item is being tracked";

const ICONS = {
    PRICE_UPDATE: "./assets/time-is-money.svg",
    PRICE_NOT_FOUND: "./assets/time.svg",
    PRICE_FIX: "./assets/coin.svg"
};

const MATCHES = {
    PRICE: /((?:\d+[.,])?\d+(?:[.,]\d+)?)/,
    HOSTNAME: /https?:\/\/([\w.]+)\/*/,
    DOMAIN: /^([\w-]+\.)+[\w-]+\w$/,
    URL: /^https?:\/\/([\w-]+\.)+[\w-]+\w(\/[\w-=.]+)+\/?(\?([\w]+=?[\w-%!@()\\["#\]]+&?)*)?/,
    CAPTURE: {
        DOMAIN_IN_URL: /https?:\/\/([\w.]+)\/*/,
        HOSTNAME_AND_PATH: /^https?:\/\/((?:[\w-]+\.)+[\w-]+\w(?:\/[\w-=.]+)+\/?)/,
        PROTOCOL_HOSTNAME_AND_PATH: /^(https?:\/\/(?:[\w-]+\.)+[\w-]+\w(?:\/[\w-=.]+)+\/?)/
    }
};

const ITEM_STATUS = {
    WATCHED: "WATCHED",
    NOT_FOUND: "NOT_FOUND",
    INCREASED: "INCREASED",
    DECREASED: "DECREASED",
    ACK_DECREASE: "ACK_DECREASE",
    ACK_INCREASE: "ACK_INCREASE",
    FIXED: "FIXED"
};

const ALL_ITEM_STATUSES = Object.values(ITEM_STATUS);

function removeStatuses(item, statusesToRemove = []) {
    return statusesToRemove.length > 0 && item.statuses.length > 0 ?
        item.statuses.filter(status => !statusesToRemove.includes(status)) :
        item.statuses;
}

function updateItemCurrentPrice(item, newPrice) {
    const previousPrice = item.currentPrice;

    const newItem = {
        ...item,
        previousPrice,
        currentPrice: newPrice
    };

    return updateItemDiffPercentage(newItem);
}

function updateItemDiffPercentage(item) {
    const diff = Math.abs(item.currentPrice - item.price) * 100 / item.price;
    const diffPerc = parseFloat(diff.toFixed(2));
    let diffPercentage = null;
    if (diffPerc) {
        diffPercentage = item.currentPrice > item.price ?
            +diffPerc :
            -diffPerc;

        if (diffPercentage > 0 && diffPercentage < 1) {
            diffPercentage = Math.ceil(diffPercentage);
        } else if (diffPercentage > -1 && diffPercentage < 0) {
            diffPercentage = Math.floor(diffPercentage);
        }
    }

    item.diffPercentage = diffPercentage;

    return item;
}

function updateItemTrackStatus(item, newPrice, statusesToAdd, statusesToRemove, forceStartingPrice = false) {
    if (!statusesToAdd) {
        statusesToAdd = [];
    }

    if (!statusesToRemove) {
        statusesToRemove = [];
    }

    const statuses = uniq([...removeStatuses(item, statusesToRemove), ...statusesToAdd]);
    const updatedItem = {
        ...item,
        statuses,
        lastUpdateTimestamp: new Date().getTime()
    };

    if (forceStartingPrice) {
        updatedItem.startingPrice = item.price;
    }

    if (newPrice) {
        updatedItem.price = newPrice;
    }

    return updatedItem;
}

function isWatched(item) {
    return item.statuses.includes(ITEM_STATUS.WATCHED);
}

function isNotFound(item) {
    return item.statuses.includes(ITEM_STATUS.NOT_FOUND);
}

function hasAcknowledgeDecrease(item) {
    return item.statuses.includes(ITEM_STATUS.ACK_DECREASE);
}

function hasAcknowledgeIncrease(item) {
    return item.statuses.includes(ITEM_STATUS.ACK_INCREASE);
}

function onConfirmURLForCreateItemAttempt(tabId, domain, url, selection, price, faviconURL, faviconAlt, callback) {
    const modalElementId = "price-tag--url-confirmation";
    chrome.tabs.sendMessage(tabId, {
        type: "CONFIRMATION_DISPLAY.CREATE",
        payload: {elementId: modalElementId}
    }, ({status}) => {
        if (status === 1) {
            const payload = buildURLConfirmationPayload(State.canonicalURL, State.browserURL, domain);
            chrome.tabs.sendMessage(tabId, {
                type: "CONFIRMATION_DISPLAY.LOAD",
                payload
            }, ({status, index}) => {
                chrome.tabs.sendMessage(tabId, {
                    type: "CONFIRMATION_DISPLAY.REMOVE",
                    payload: {elementId: modalElementId}
                });

                switch (status) {
                    case 1:
                        switch (index) {
                            case 0:
                                // said Yes, can use canonical and remember this option
                                chrome.storage.local.get([domain], result => {
                                    const domainState = result && result[domain] && JSON.parse(result[domain]) || {};
                                    domainState._canUseCanonical = true;
                                    chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                    State = StateFactory.updateCurrentURL(State, State.canonicalURL);
                                    callback(true, true);
                                });
                                break;
                            case 1:
                                // said Yes, but use canonical just this time
                                State = StateFactory.updateCurrentURL(State, State.canonicalURL);
                                callback(true, true);
                                break;
                            case 2:
                                // said No, use browser URL and remember this option
                                chrome.storage.local.get([domain], result => {
                                    const domainState = result && result[domain] && JSON.parse(result[domain]) || {};
                                    domainState._canUseCanonical = false;
                                    chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                    State = StateFactory.updateCurrentURL(State, State.browserURL);
                                    callback(true, false);
                                });
                                break;
                            case 3:
                                // said No, use browser URL but ask again
                                State = StateFactory.updateCurrentURL(State, State.browserURL);
                                callback(true, false);
                                break;
                            default:
                                // cannot recognize this modal button click
                                callback(false);
                                break;
                        }
                        break;
                    case 2:
                        // close modal
                        callback(false);
                        break;
                    default:
                        callback(false);
                        break;
                }
            });
        }
    });
}

function onRecordDone(tabId, payload) {
    const {status, selection, price, faviconURL, faviconAlt} = payload;
    const {currentURL, domain} = State;
    if (status > 0) {
        State = StateFactory.updateFaviconURL(State, State.faviconURL || faviconURL);
        canDisplayURLConfirmation(State, domain, canDisplay => {
            if (canDisplay) {
                onConfirmURLForCreateItemAttempt(tabId, domain, currentURL, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
                    if (canSave) {
                        const url = useCaninocal ? State.canonicalURL : State.browserURL;
                        checkForURLSimilarity(tabId, domain, url, isToSave => {
                            if (isToSave) {
                                createItem(domain, url, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
                                updateExtensionAppearance(domain, url, true);
                            }
                        });
                    }
                });
            } else {
                checkForURLSimilarity(tabId, domain, currentURL, isToSave => {
                    if (isToSave) {
                        createItem(domain, currentURL, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
                        updateExtensionAppearance(domain, currentURL, true);
                    }
                });
            }
        });

        State = StateFactory.disableRecord(State);
    }
}

function onRecordCancel() {
    State = StateFactory.disableRecord(State);
}

function onAutoSaveCheckStatus(sendResponse, {status, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        State = StateFactory.updateFaviconURL(State, State.faviconURL || faviconURL);
        State = StateFactory.setSelectionInfo(State, selection, price, State.faviconURL, faviconAlt);
        sendResponse(true);
    } else {
        sendResponse(false);
    }
}

function onPriceUpdateCheckStatus(sendResponse, trackedPrice, {status, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        State = StateFactory.updateFaviconURL(State, State.faviconURL || faviconURL);
        State = StateFactory.setSelectionInfo(State, selection, price, State.faviconURL, faviconAlt);
        if (toPrice(price) !== trackedPrice) {
            sendResponse(true);
            return;
        }
    }

    sendResponse(false);
}

function onSimilarElementHighlight({status, isHighlighted: isSimilarElementHighlighted, originalBackgroundColor = null}) {
    if (status >= 0) {
        State = StateFactory.setSimilarElementHighlight(State, isSimilarElementHighlighted, originalBackgroundColor);
    }
}

// TODO: price becomes a class
function createItem(domain, url, selection, price, faviconURL, faviconAlt, statuses, callback) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        items[url] = new Item(selection, toPrice(price), null, faviconURL, faviconAlt, statuses);

        chrome.storage.local.set({[domain]: JSON.stringify(items)}, () => {
            State = StateFactory.disableAutoSave(State);
            if (callback) {
                callback();
            }
            // TODO: sendResponse("done"); // foi gravado ou não
        });
    });
}

function canDisplayURLConfirmation(state, domain, callback) {
    chrome.storage.local.get([domain], result => {
        const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
        const isUseCanonicalPrefUnset = !domainState || domainState._canUseCanonical === undefined;
        callback(isUseCanonicalPrefUnset && !!state.canonicalURL &&
            state.canonicalURL !== state.browserURL);
    });
}

function setDefaultAppearance() {
    chrome.browserAction.setTitle({title: DEFAULT_TITLE});
    chrome.browserAction.setIcon({path: DEFAULT_ICON});
}

function setTrackedItemAppearance() {
    chrome.browserAction.setTitle({title: TRACKED_ITEM_TITLE});
    chrome.browserAction.setIcon({path: TRACKED_ITEM_ICON});
}

function checkForPriceChanges() {
    chrome.storage.local.get(null, result => {
        for (let domain in result) {
            if (result.hasOwnProperty(domain) && matchesDomain(domain)) {
                const domainItems = JSON.parse(result[domain]);

                for (let url in domainItems) {
                    if (domainItems.hasOwnProperty(url) && matchesURL(url) && isWatched(domainItems[url])) {
                        const request = new XMLHttpRequest();
                        const {price: targetPrice, currentPrice} = domainItems[url];

                        request.onload = function () {
                            const template = createHTMLTemplate(this.response);
                            try {
                                let newPrice = null;
                                const {textContent} = template.querySelector(domainItems[url].selection);
                                if (textContent) {
                                    const textContentMatch = textContent.match(MATCHES.PRICE);
                                    if (textContentMatch) {
                                        [, newPrice] = textContentMatch;

                                        newPrice = toPrice(newPrice);

                                        if (!targetPrice) {
                                            domainItems[url] = updateItemTrackStatus(domainItems[url], newPrice,
                                                [ITEM_STATUS.FIXED], [ITEM_STATUS.NOT_FOUND]);
                                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                const notificationId = `TRACK.PRICE_FIXED-${State.notificationsCounter}`;
                                                createNotification(notificationId, ICONS.PRICE_FIX, "Fixed price",
                                                    `Ermm.. We've just fixed a wrongly set price to ${newPrice}`, url, url, domain);
                                            });
                                        } else if (newPrice < currentPrice) {
                                            const updatedItem = updateItemCurrentPrice(domainItems[url], newPrice);
                                            domainItems[url] = updateItemTrackStatus(updatedItem, null,
                                                [ITEM_STATUS.DECREASED],
                                                [ITEM_STATUS.INCREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_DECREASE]);

                                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                // TODO: sendResponse("done"); // foi actualizado ou não
                                                if (newPrice < targetPrice && !hasAcknowledgeDecrease(domainItems[url])) {
                                                    const notificationId = `TRACK.PRICE_UPDATE-${State.notificationsCounter}`;
                                                    createNotification(notificationId, ICONS.PRICE_UPDATE, "Lower price!!",
                                                        `${newPrice} (previous ${targetPrice})`, url, url, domain, ITEM_STATUS.DECREASED,
                                                        {
                                                            buttons: [
                                                                {
                                                                    title: `Keep tracking but w/ new price (${newPrice})`
                                                                },
                                                                {
                                                                    title: "Stop watching"
                                                                }
                                                            ]
                                                        });
                                                }
                                            });
                                        } else if (newPrice > currentPrice) {
                                            const updatedItem = updateItemCurrentPrice(domainItems[url], newPrice); // update current price and previous
                                            domainItems[url] = updateItemTrackStatus(updatedItem, null,
                                                [ITEM_STATUS.INCREASED],
                                                [ITEM_STATUS.DECREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_INCREASE]);

                                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                // TODO: sendResponse("done"); // foi actualizado ou não

                                                if (!hasAcknowledgeIncrease(domainItems[url])) {
                                                    const notificationId = `TRACK.PRICE_UPDATE-${State.notificationsCounter}`;
                                                    const notificationOptions = domainItems[url].price !== domainItems[url].previousPrice ?
                                                        {
                                                            buttons: [
                                                                {
                                                                    title: `Increase interest price to the previous (${domainItems[url].previousPrice})`
                                                                }
                                                            ]
                                                        } :
                                                        {
                                                            buttons: []
                                                        };
                                                    notificationOptions.buttons.push(
                                                        {
                                                            title: "Stop watching"
                                                        }
                                                    );
                                                    createNotification(notificationId, ICONS.PRICE_UPDATE, "Price increase",
                                                        `${newPrice} (previous ${domainItems[url].previousPrice})`, url, url, domain, ITEM_STATUS.INCREASED,
                                                        notificationOptions);
                                                }
                                            });
                                        } else if (!isNotFound(domainItems[url])) { // NOTE: Here, price is the same
                                            domainItems[url] = updateItemTrackStatus(domainItems[url], null,
                                                null, [ITEM_STATUS.NOT_FOUND]);
                                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                // TODO: sendResponse("done"); // foi actualizado ou não
                                            });
                                        } else {
                                            domainItems[url] = updateItemTrackStatus(domainItems[url], null,
                                                null, [ITEM_STATUS.NOT_FOUND]);
                                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
                                        }
                                    }
                                }

                                if (domainItems[url].price && !newPrice) {
                                    if (!isNotFound(domainItems[url])) {
                                        domainItems[url] = updateItemTrackStatus(domainItems[url], null,
                                            [ITEM_STATUS.NOT_FOUND],
                                            [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);

                                        chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                            // TODO: sendResponse("done"); // foi actualizado ou não
                                            const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                                            const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                                            createNotification(notificationId, ICONS.PRICE_NOT_FOUND, "Price gone",
                                                `Price tag no longer found${previousPrice}`, url, url, domain);
                                        });
                                    }
                                }
                            } catch (e) {
                                if (!isNotFound(domainItems[url])) {
                                    console.warn(`Invalid price selection element in\n${url}:\t"${domainItems[url].selection}"`);
                                    domainItems[url] = updateItemTrackStatus(domainItems[url], null,
                                        [ITEM_STATUS.NOT_FOUND],
                                        [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);

                                    chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                        const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                                        const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                                        createNotification(notificationId, ICONS.PRICE_NOT_FOUND, "Price gone",
                                            `Price tag no longer found${previousPrice}`, url, url, domain);
                                    });
                                }
                            }
                        };

                        request.open("GET", url);
                        request.send();
                    }
                }
            }
        }
    });
}

function getTrackedItemsSortedBy(sortType, callback) {
    chrome.storage.local.get(null, result => {
        let trackedItems = [];
        Object.keys(result).forEach(key => {
            if (matchesDomain(key)) {
                const domainData = result[key];
                const domainItems = JSON.parse(domainData) || null;
                if (domainItems) {
                    let items = [];
                    Object.keys(domainItems).forEach(url => {
                        if (matchesHostname(url) && isWatched(domainItems[url])) {
                            const item = {
                                ...domainItems[url],
                                url: url
                            };
                            items.push(item);
                        }
                    });
                    trackedItems = [...trackedItems, ...items];
                }
            }
        });
        const sortByFn = sortTrackedItemsBy[sortType];
        trackedItems.sort(sortByFn);
        callback(trackedItems);
    });
}

function removeTrackedItem(url, currentURL, callback) {
    let found = false;
    chrome.storage.local.get(null, result => {
        Object.keys(result).forEach(domain => {
            if (matchesDomain(domain)) {
                const domainData = result[domain];
                const domainItems = JSON.parse(domainData) || null;
                if (domainItems[url]) {
                    found = true;

                    if (State._undoRemovedItemsResetTask) {
                        clearTimeout(State._undoRemovedItemsResetTask);
                        State = StateFactory.setUndoRemovedItemsResetTask(State, null);
                    }

                    const removedItem = {...domainItems[url]};
                    State = StateFactory.addUndoRemovedItem(State, url, removedItem, MAX_UNDO_REMOVED_ITEMS);
                    chrome.runtime.sendMessage({
                        type: "TRACKED_ITEMS.UNDO_STATUS",
                        payload: {isUndoStatusActive: true}
                    });

                    const undoRemovedItemsTask = setTimeout(() => {
                        State = StateFactory.resetUndoRemovedItems(State);
                        chrome.runtime.sendMessage({
                            type: "TRACKED_ITEMS.UNDO_STATUS",
                            payload: {isUndoStatusActive: false}
                        });
                    }, UNDO_REMOVED_ITEMS_TIMEOUT);

                    State = StateFactory.setUndoRemovedItemsResetTask(State, undoRemovedItemsTask);

                    domainItems[url] = updateItemTrackStatus(domainItems[url], null, null, [ITEM_STATUS.WATCHED]); // stop watching
                    chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                        if (currentURL === url) {
                            updateAutoSaveStatus(url, domain);
                            updatePriceUpdateStatus(url, domain);
                            updateExtensionAppearance(domain, url, false);
                        }
                        callback(true);
                    });
                }
            }
        });
        if (!found) {
            callback(false);
        }
    });
}

function undoRemoveTrackedItem(url, currentURL, callback) {
    let found = false;
    chrome.storage.local.get(null, result => {
        Object.keys(result).forEach(domain => {
            if (matchesDomain(domain)) {
                const domainData = result[domain];
                const domainItems = JSON.parse(domainData) || null;
                if (domainItems[url]) {
                    found = true;

                    domainItems[url] = updateItemTrackStatus(domainItems[url], null, [ITEM_STATUS.WATCHED], null); // start watch again
                    chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                        if (currentURL === url) {
                            updateAutoSaveStatus(url, domain);
                            updatePriceUpdateStatus(url, domain);
                            updateExtensionAppearance(domain, url, false);
                        }
                        callback(true);
                    });
                }
            }
        });
        if (!found) {
            // No special treatment if item is not found; we can't undo nothing
            callback(true);
        }
    });
}

function clearNotification(notifId, wasClosedByUser) {
    chrome.notifications.clear(notifId, wasClickedByUser => {
        if (wasClickedByUser || wasClosedByUser) {
            const {domain, url, type} = State.notifications[notifId];
            chrome.storage.local.get([domain], result => {
                const domainItems = result && result[domain] ? JSON.parse(result[domain]) : null;
                switch (type) {
                    case ITEM_STATUS.DECREASED:
                        domainItems[url] = updateItemTrackStatus(domainItems[url], null, [ITEM_STATUS.ACK_DECREASE]);
                        break;
                    case ITEM_STATUS.INCREASED:
                        domainItems[url] = updateItemTrackStatus(domainItems[url], null, [ITEM_STATUS.ACK_INCREASE]);
                        break;
                }

                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
            });
        }

        State = StateFactory.deleteNotificationsItem(State, notifId);
    });
}

function createNotification(notifId, iconUrl, title, message, contextMessage = "", url, domain, type, extraOptions = {}) {
    const options = {
        type: "basic",
        title,
        message,
        iconUrl,
        contextMessage,
        requireInteraction: true,
        ...extraOptions
    };

    chrome.notifications.create(notifId, options, id => {
        State = StateFactory.updateNotificationsItem(State, id, {
            url,
            domain,
            type
        });
    });

    State = StateFactory.incrementNotificationsCounter(State);
}

function isCanonicalURLRelevant(canonical) {
    return canonical && matchesHostnameAndPath(canonical);
}

function matchesDomain(string) {
    return MATCHES.DOMAIN.test(string);
}

function matchesHostname(string) {
    return MATCHES.HOSTNAME.test(string);
}

function matchesHostnameAndPath(string) {
    return MATCHES.CAPTURE.HOSTNAME_AND_PATH.test(string);
}

function matchesURL(string) {
    return MATCHES.URL.test(string);
}

function parseDomainState(result, domain) {
    return result && result[domain] && JSON.parse(result[domain]) || null;
}

function setupTrackingPolling() {
    checkForPriceChanges();
    setInterval(checkForPriceChanges, PRICE_CHECKING_INTERVAL);
}

function updateAutoSaveStatus(url, domain) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        const isItemNullOrUnwatched = !items[url] || !isWatched(items[url]);
        if (items && isItemNullOrUnwatched) {
            const urlFromDomain = Object.keys(items)[0];
            if (items[urlFromDomain] && items[urlFromDomain].selection) {
                State = StateFactory.enableAutoSave(State, items[urlFromDomain].selection);
            }
        } else {
            State = StateFactory.disableAutoSave(State);
        }
    });
}

function updatePriceUpdateStatus(url, domain) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        const item = items[url];
        const hasItemPriceIncOrDec = item && item.price !== item.currentPrice;
        if (hasItemPriceIncOrDec) {
            State = StateFactory.enablePriceUpdate(State, item.selection);
        } else {
            State = StateFactory.disablePriceUpdate(State);
        }
    });
}

function updateExtensionAppearance(currentDomain, currentURL, forcePageTrackingTo, fullURL) {
    if (forcePageTrackingTo === true) {
        setTrackedItemAppearance();
        State = StateFactory.enableCurrentPageTracked(State);
    } else if (forcePageTrackingTo === false) {
        setDefaultAppearance();
        State = StateFactory.disableCurrentPageTracked(State);
    } else if (!forcePageTrackingTo) {
        chrome.storage.local.get([currentDomain], result => {
            const domainState = parseDomainState(result, currentDomain);
            if (domainState) {
                // NOTE: Making sure that full URL is also checked because item may have been saved with full URL
                // in the past
                const item = domainState[currentURL] || domainState[fullURL];
                if (item && isWatched(item)) {
                    setTrackedItemAppearance();
                    State = StateFactory.enableCurrentPageTracked(State);
                } else {
                    setDefaultAppearance();
                    State = StateFactory.disableCurrentPageTracked(State);
                }
            } else {
                setDefaultAppearance();
                State = StateFactory.disableCurrentPageTracked(State);
            }
        });
    }
}

function captureHostAndPathFromURL(url) {
    const captureHostAndPath = url.match(MATCHES.CAPTURE.HOSTNAME_AND_PATH);
    let hostAndPath = null;
    if (captureHostAndPath) {
        [, hostAndPath] = captureHostAndPath;
    }
    return hostAndPath;
}

function captureProtocolHostAndPathFromURL(url) {
    const captureProtocolHostAndPath = url.match(MATCHES.CAPTURE.PROTOCOL_HOSTNAME_AND_PATH);
    let protocolHostAndPath = null;
    if (captureProtocolHostAndPath) {
        [, protocolHostAndPath] = captureProtocolHostAndPath;
    }
    return protocolHostAndPath;
}

function searchForEqualPathWatchedItem(domainState, currentURL, callback) {
    const currentHostAndPath = captureHostAndPathFromURL(currentURL);
    let foundOne = false;
    for (let url in domainState) {
        if (domainState.hasOwnProperty(url) && matchesURL(url)) {
            if (isWatched(domainState[url])) {
                if (currentURL === url) {
                    //    if they're exactly the same
                    callback(null);
                    return;
                } else {
                    const hostAndPath = captureHostAndPathFromURL(url);
                    if (hostAndPath === currentHostAndPath) {
                        foundOne = foundOne === false;
                        callback(url);
                        return;
                    }
                }
            }
        }
    }

    callback(null);
}

function buildSaveConfirmationPayload(currentURL, similarURL) {
    return {
        title: "Item with similar URL to existing one",
        message: "It appears that the item URL you're trying to save:<br>" +
            `<i><a href="${currentURL}" target="_blank" rel="noopener noreferrer">${currentURL}</a></i><br>` +
            "is pretty similar to<br>" +
            `<i><a href="${similarURL}" target="_blank" rel="noopener noreferrer">${similarURL}</a></i><br><br>` +
            "Since your choice will affect the way items are tracked in this site futurely,<br>please help us helping you by choosing carefully one of the following options:",
        buttons: [
            "It's not, save it! Remember this option for this site.",
            "Don't save. Ask me again for items of this site!",
            "Indeed the same item. Don't save! Remember this option for this site. (Use just URL path for accessing items)",
            "For now save this item. Ask me again next time!"
        ]
    };
}

function buildURLConfirmationPayload(canonicalURL, browserURL, domain) {
    return {
        title: "This website recommends to follow this item through a different URL",
        message: `<u>${domain}</u> says that a more accurate URL for this item would be:<br>` +
            `<i><a href="${canonicalURL}" target="_blank"  rel="noopener noreferrer">${canonicalURL}</a></i><br>` +
            "If this is correct, we recommend you to follow it.<br><br>" +
            "<b>However</b> you can still opt to choose following the current browser URL:<br>" +
            `<i><a href="${browserURL}" target="_blank" rel="noopener noreferrer">${browserURL}</a></i><br><br>` +
            "Since your choice will affect the way items are tracked in this site futurely,<br>please help us helping you by choosing carefully one of the following options:",
        buttons: [
            "Use recommended URL. Remember this option for this site",
            "Use recommended URL but just this time",
            "It's not correct, use the current browser URL. Remember this option",
            "Don't use recommended URL. Use the current browser URL instead but just this time"
        ]
    };
}

function checkForURLSimilarity(tabId, domain, currentURL, callback) {
    chrome.storage.local.get([domain], result => {
        const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
        if (domainState) {
            if (domainState._isPathEnoughToTrack === true) {
                // since it's true we can say that that domain items' path is enough to track items in this domain
                searchForEqualPathWatchedItem(domainState, currentURL, similarURL => {
                    if (similarURL) {
                        callback(false, false);
                    } else {
                        callback(true);
                    }
                });
            } else if (domainState._isPathEnoughToTrack === false) {
                callback(true);
            } else {
                // it's the first time user is being inquired about items similarity in this domain
                searchForEqualPathWatchedItem(domainState, currentURL, similarURL => {
                    if (similarURL) {
                        // found an URL whose host and path are equals to the currentURL trying to be saved
                        // prompt user to confirm if the item is the same

                        const modalElementId = "price-tag--save-confirmation";
                        chrome.tabs.sendMessage(tabId, {
                            type: "CONFIRMATION_DISPLAY.CREATE",
                            payload: {elementId: modalElementId}
                        }, ({status}) => {
                            if (status === 1) {
                                const payload = buildSaveConfirmationPayload(currentURL, similarURL);
                                chrome.tabs.sendMessage(tabId, {
                                    type: "CONFIRMATION_DISPLAY.LOAD",
                                    payload
                                }, ({status, index}) => {
                                    chrome.tabs.sendMessage(tabId, {
                                        type: "CONFIRMATION_DISPLAY.REMOVE",
                                        payload: {elementId: modalElementId}
                                    });
                                    switch (status) {
                                        case 1:
                                            switch (index) {
                                                case 0:
                                                    // said Yes: not the same item
                                                    domainState._isPathEnoughToTrack = false;
                                                    chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                                    callback(true);
                                                    break;
                                                case 1:
                                                    callback(false, true);
                                                    break;
                                                case 2:
                                                    // said No: same item (path is enough for this site items)
                                                    domainState._isPathEnoughToTrack = true;
                                                    chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                                    callback(false, false);
                                                    break;
                                                case 3:
                                                    // said Save this but for others Ask me later
                                                    callback(true);
                                                    break;
                                                default:
                                                    // cannot recognize this modal button click
                                                    callback(false, true);
                                                    break;
                                            }
                                            break;
                                        case 2:
                                            // close modal
                                            callback(false, true);
                                            break;
                                        default:
                                            // something wrong with modal interaction
                                            callback(false, true);
                                            break;
                                    }
                                });
                            } else {
                                // something went wrong creating the modal
                                callback(false, true);
                            }
                        });
                    }
                    else {
                        // no URL has host and path equals to the currentURL (can save the item)
                        callback(true);
                    }
                });
            }
        } else {
            // this means it's the first item being saved belonging to this domain (can save the item)
            callback(true);
        }
    });
}

function onXHR(url, callback) {
    const request = new XMLHttpRequest();
    request.onload = function () {
        const template = createHTMLTemplate(this.response);
        callback(template);
    };
    request.open("GET", url);
    request.send();

}

function onTabContextChange(tabId, url) {
    const captureDomain = url.match(MATCHES.CAPTURE.DOMAIN_IN_URL);
    if (captureDomain) {
        const [, domain] = captureDomain;
        State = StateFactory.updateCurrentDomain(State, domain);
        chrome.storage.local.get([domain], result => {
            const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
            // check if user has already a preference to use the canonical URL if available
            if (domainState && domainState._canUseCanonical === false) {
                State = StateFactory.updateCanonicalURL(State, null);
                State = StateFactory.updateCurrentURL(State, url);
                State = StateFactory.updateBrowserURL(State, url);

                if (domainState._isPathEnoughToTrack === true) {
                    const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                    if (protocolHostAndPathFromURL) {
                        State = StateFactory.updateCurrentURL(State, protocolHostAndPathFromURL);
                        State = StateFactory.updateBrowserURL(State, protocolHostAndPathFromURL);
                    }
                }

                updateAutoSaveStatus(State.currentURL, State.domain);
                updatePriceUpdateStatus(State.currentURL, State.domain);
                updateExtensionAppearance(State.domain, State.currentURL, null, url);
            } else {
                // First thing to do, check:
                // If canonical was updated (compared to the previously) + if it's relevant
                State = StateFactory.updateBrowserURL(State, url);

                onXHR(url, template => {
                    const canonicalURL = getCanonicalPathFromSource(template);
                    const canUseCanonical = isCanonicalURLRelevant(canonicalURL);

                    if (canUseCanonical) {
                        State = StateFactory.updateCurrentURL(State, canonicalURL);
                        State = StateFactory.updateCanonicalURL(State, canonicalURL);
                    } else {
                        State = StateFactory.updateCanonicalURL(State, null);
                        State = StateFactory.updateCurrentURL(State, url);

                        if (domainState && domainState._isPathEnoughToTrack === true) {
                            const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                            if (protocolHostAndPathFromURL) {
                                State = StateFactory.updateCurrentURL(State, protocolHostAndPathFromURL);
                                State = StateFactory.updateBrowserURL(State, protocolHostAndPathFromURL);
                            }
                        }
                    }

                    updateAutoSaveStatus(State.currentURL, State.domain);
                    updatePriceUpdateStatus(State.currentURL, State.domain);
                    updateExtensionAppearance(State.domain, State.currentURL, null, url);
                });
            }
        });
    }
}

// TODO: break this down into smaller functions
function attachEvents() {
    chrome.runtime.onInstalled.addListener(() => {
        console.log("Price tag installed.");
    });

    chrome.tabs.onActivated.addListener(() => {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            if (url.startsWith("http")) {
                onTabContextChange(id, url);
                State = StateFactory.updateFaviconURL(State, State._faviconURLMap[id] || null);
            } else {
                setDefaultAppearance();
            }
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, {favIconUrl}, {active, url}) => {
        if (url.startsWith("http")) {
            if (active) {
                if (favIconUrl) {
                    State = StateFactory.updateFaviconURLMapItem(State, tabId, favIconUrl);
                    State = StateFactory.updateFaviconURL(State, favIconUrl);
                }
            }
        } else {
            setDefaultAppearance();
        }
    });

    chrome.webNavigation.onCompleted.addListener(({frameId}) => {
        if (frameId === 0) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs.length > 0) {
                    const [{id, url}] = tabs;
                    onTabContextChange(id, url);
                }
            });
        }
    });

    chrome.webNavigation.onHistoryStateUpdated.addListener(() => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                const [{id: tabId, url}] = tabs;
                if (url !== undefined && url !== State.browserURL) {
                    onTabContextChange(tabId, url);
                }
            }
        });
    });

    chrome.runtime.onMessage.addListener(
        ({type, payload = {}}, sender, sendResponse) => {
            let isUndoStatusActive;
            const {id, url: itemUrl, sortByType} = payload;
            const {recordActive, autoSaveEnabled, isPriceUpdateEnabled, currentURL: url, domain} = State;
            switch (type) {
                case "POPUP.STATUS":
                    sendResponse({status: 1, state: {recordActive, autoSaveEnabled, isPriceUpdateEnabled}});
                    break;
                case "RECORD.ATTEMPT":
                    State = StateFactory.toggleRecord(State);

                    if (State.recordActive) {
                        const {url} = payload;
                        chrome.tabs.sendMessage(id, {
                            type: "RECORD.START",
                            payload: {url}
                        }, onRecordDone.bind(null, id));
                    } else {
                        chrome.tabs.sendMessage(id, {type: "RECORD.CANCEL"}, onRecordCancel);
                    }
                    sendResponse({status: 1, state: {recordActive: State.recordActive}});
                    break;
                case "AUTO_SAVE.STATUS":
                    chrome.storage.local.get([domain], result => {
                        const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
                        if (domainState) {
                            if (domainState._isPathEnoughToTrack === true) {
                                // since it's true we can say that that domain items' path is enough to track items in this domain
                                searchForEqualPathWatchedItem(domainState, url, similarURL => {
                                    if (!similarURL) {
                                        chrome.tabs.sendMessage(id, {
                                            type: "AUTO_SAVE.CHECK_STATUS",
                                            payload: {url, selection: State.selection}
                                        }, onAutoSaveCheckStatus.bind(null, sendResponse));
                                    } else {
                                        sendResponse({status: -1});
                                    }
                                });
                            } else {
                                chrome.tabs.sendMessage(id, {
                                    type: "AUTO_SAVE.CHECK_STATUS",
                                    payload: {url, selection: State.selection}
                                }, onAutoSaveCheckStatus.bind(null, sendResponse));
                            }
                        } else {
                            // domain doesn't exist
                            chrome.tabs.sendMessage(id, {
                                type: "AUTO_SAVE.CHECK_STATUS",
                                payload: {url, selection: State.selection}
                            }, onAutoSaveCheckStatus.bind(null, sendResponse));
                        }
                    });
                    return true;
                case "AUTO_SAVE.ATTEMPT":
                    if (State.autoSaveEnabled) {
                        const {domain, currentURL: stateUrl, selection, price, faviconURL, faviconAlt, originalBackgroundColor} = State;

                        canDisplayURLConfirmation(State, domain, canDisplay => {
                            if (canDisplay) {
                                onConfirmURLForCreateItemAttempt(id, domain, stateUrl, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
                                    if (canSave) {
                                        const url = useCaninocal ? State.canonicalURL : State.browserURL;

                                        checkForURLSimilarity(id, domain, url, (isToSave, autoSaveStatus) => {
                                            if (isToSave) {
                                                createItem(domain, url, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED], () => {
                                                    chrome.tabs.sendMessage(id, {
                                                        type: "PRICE_TAG.HIGHLIGHT.STOP",
                                                        payload: {selection, originalBackgroundColor}
                                                    }, onSimilarElementHighlight);

                                                    updateExtensionAppearance(domain, url, true);
                                                    State = StateFactory.disableAutoSave(State);

                                                    sendResponse(false);
                                                });
                                            } else {
                                                // For Exceptions (including when there's similar item - should be caught by "AUTO_SAVE.STATUS")
                                                if (!autoSaveStatus) {
                                                    State = StateFactory.disableAutoSave(State);
                                                }
                                            }
                                        });
                                    }
                                });
                            } else {
                                checkForURLSimilarity(id, domain, stateUrl, isToSave => {
                                    if (isToSave) {
                                        createItem(domain, stateUrl, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED], () => {
                                            chrome.tabs.sendMessage(id, {
                                                type: "PRICE_TAG.HIGHLIGHT.STOP",
                                                payload: {selection, originalBackgroundColor}
                                            }, onSimilarElementHighlight);

                                            updateExtensionAppearance(domain, stateUrl, true);
                                            State = StateFactory.disableAutoSave(State);

                                            sendResponse(false);
                                        });
                                    }
                                });
                            }
                        });

                        return true;
                    } else {
                        sendResponse(false);
                    }
                    break;
                case "AUTO_SAVE.HIGHLIGHT.PRE_START":
                    if (State.autoSaveEnabled) {
                        const {selection} = State;
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.START",
                            payload: {selection}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "AUTO_SAVE.HIGHLIGHT.PRE_STOP":
                    if (State.autoSaveEnabled) {
                        const {selection, originalBackgroundColor} = State;
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.STOP",
                            payload: {selection, originalBackgroundColor}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "PRICE_UPDATE.STATUS":
                    chrome.storage.local.get([State.domain], result => {
                        const domainItems = result && result[State.domain] ? JSON.parse(result[State.domain]) : {};
                        const item = domainItems[State.currentURL];
                        if (item) {
                            chrome.tabs.sendMessage(id, {
                                type: "PRICE_UPDATE.CHECK_STATUS",
                                payload: {selection: State.selection}
                            }, onPriceUpdateCheckStatus.bind(null, sendResponse, item.price));
                        } else {
                            sendResponse(false);
                        }
                    });
                    return true;
                case "PRICE_UPDATE.ATTEMPT":
                    if (State.isPriceUpdateEnabled) {
                        const {domain, currentURL: stateUrl, selection, price: updatedPrice, originalBackgroundColor} = State;
                        const price = updatedPrice && toPrice(updatedPrice);
                        chrome.storage.local.get([domain], result => {
                            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};

                            domainItems[stateUrl] = updateItemTrackStatus(domainItems[stateUrl], price,
                                null,
                                [
                                    ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE,
                                    ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED,
                                    ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE,
                                    ITEM_STATUS.DECREASED, ITEM_STATUS.DECREASED,
                                    ITEM_STATUS.NOT_FOUND
                                ]);
                            domainItems[stateUrl] = updateItemDiffPercentage(domainItems[stateUrl]);

                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});

                            chrome.tabs.sendMessage(id, {
                                type: "PRICE_TAG.HIGHLIGHT.STOP",
                                payload: {selection, originalBackgroundColor}
                            }, onSimilarElementHighlight);

                            State = StateFactory.disablePriceUpdate(State);
                            sendResponse(false);
                        });
                    }
                    return true;
                case "PRICE_UPDATE.HIGHLIGHT.PRE_START":
                    if (State.isPriceUpdateEnabled) {
                        const {selection} = State;
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.START",
                            payload: {selection}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "PRICE_UPDATE.HIGHLIGHT.PRE_STOP":
                    if (State.isPriceUpdateEnabled) {
                        const {selection, originalBackgroundColor} = State;
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.STOP",
                            payload: {selection, originalBackgroundColor}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "TRACKED_ITEMS.OPEN":
                    State = StateFactory.updateSortItemsBy(State, SORT_ITEMS_BY_TIME);
                    isUndoStatusActive = State._undoRemovedItems.length > 0;
                    sendResponse({isUndoStatusActive});
                    break;
                case "TRACKED_ITEMS.GET":
                    getTrackedItemsSortedBy(State._sortItemsBy, sendResponse);
                    return true;
                case "TRACKED_ITEMS.UNFOLLOW":
                    removeTrackedItem(itemUrl, State.currentURL, sendResponse);
                    return true;
                case "TRACKED_ITEMS.CHANGE_SORT":
                    State = StateFactory.updateSortItemsBy(State, SORT_BY_TYPES[sortByType]);
                    break;
                case "TRACKED_ITEMS.UNDO_ATTEMPT":
                    if (State._undoRemovedItems.length > 0) {
                        const undoRemovedItem = StateFactory.getUndoRemovedItemsHead(State);

                        undoRemoveTrackedItem(undoRemovedItem.url, State.currentURL, response => {
                            if (response) {
                                State = StateFactory.removeUndoRemovedItem(State);
                                State._undoRemovedItems.length === 0 ?
                                    sendResponse({isUndoStatusActive: false}) :
                                    sendResponse({isUndoStatusActive: true});
                            }
                        });
                        return true;
                    } else {
                        sendResponse({isUndoStatusActive: false})
                    }
                    break;
            }
        });

    chrome.notifications.onClicked.addListener(notifId => {
        chrome.tabs.create({url: State.notifications[notifId].url});
        clearNotification(notifId);
    });


    // TODO: update and keep tracking
    chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
        const {domain, url, type} = State.notifications[notifId];
        switch (buttonIndex) {
            case 0:
                switch (type) {
                    case ITEM_STATUS.DECREASED:
                        chrome.storage.local.get([domain], result => {
                            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
                            if (domainItems[url]) {
                                const {price: newPrice} = domainItems[url];
                                domainItems[url] = updateItemTrackStatus(domainItems[url], newPrice, null, [ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE], true);
                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
                            }
                        });
                        break;
                    case ITEM_STATUS.INCREASED:
                        chrome.storage.local.get([domain], result => {
                            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
                            if (domainItems[url]) {
                                const {previousPrice: priceBeforeIncreasing} = domainItems[url];
                                domainItems[url] = updateItemTrackStatus(domainItems[url], priceBeforeIncreasing, null, [ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE], true);
                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
                            }
                        });
                        break;
                }
                break;
            case 1:
                switch (type) {
                    case ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED:
                        chrome.storage.local.get([domain], result => {
                            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
                            if (domainItems[url]) {
                                domainItems[url] = updateItemTrackStatus(domainItems[url], null, null, ALL_ITEM_STATUSES); // stop watching
                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
                            }
                        });
                        break;
                }
                break;
        }
    });

    chrome.notifications.onClosed.addListener(clearNotification);
}

function filterAllTrackedItems(result) {
    let filteredResult = {};
    for (let domain in result) {
        if (result.hasOwnProperty(domain) && matchesDomain(domain) && result[domain]) {
            const domainItems = JSON.parse(result[domain]);
            filteredResult = {
                ...filteredResult,
                [domain]: domainItems
            };
        }
    }
    return filteredResult;
}

function syncStorageState() {
    chrome.storage.local.get(null, localResult => {
        const localState = filterAllTrackedItems(localResult);

        chrome.storage.sync.get(null, syncResult => {
                const syncState = filterAllTrackedItems(syncResult);
                // TODO: replace this with a lodash cloneDeep !!
                const freshState = JSON.parse(JSON.stringify(localState));

                for (let syncDomain in syncState) {
                    if (syncState.hasOwnProperty(syncDomain) && matchesDomain(syncDomain)) {
                        const syncStateDomain = syncState[syncDomain];
                        if (!freshState[syncDomain]) {
                            // TODO: replace this with a lodash cloneDeep !!
                            freshState[syncDomain] = JSON.parse(JSON.stringify(syncStateDomain));
                        } else {
                            for (let syncUrl in syncStateDomain) {
                                if (syncStateDomain.hasOwnProperty(syncUrl)) {
                                    const syncItem = syncStateDomain[syncUrl];
                                    if (!freshState[syncDomain][syncUrl]) {
                                        freshState[syncDomain][syncUrl] = Object.assign({}, syncItem);
                                    } else if (syncItem.lastUpdateTimestamp > freshState[syncDomain][syncUrl].lastUpdateTimestamp) {
                                        // TODO: replace this with a lodash cloneDeep !!
                                        freshState[syncDomain][syncUrl] = JSON.parse(JSON.stringify(syncItem));
                                    }
                                }
                            }
                        }

                    }
                }

                chrome.storage.local.set(StateFactory.toStorageStateFormat(freshState));
                chrome.storage.sync.set(StateFactory.toStorageStateFormat(freshState));
            }
        );
    });
}

function setupSyncStorageState() {
    syncStorageState();
    setInterval(syncStorageState, SYNCHING_INTERVAL);
}

function bootstrap() {
    setupSyncStorageState();
    setupTrackingPolling();
    attachEvents();
}

bootstrap();
