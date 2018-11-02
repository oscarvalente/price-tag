import * as SORT_BY_TYPES from "./src/config/sort-tracked-items";
import {TIME as SORT_ITEMS_BY_TIME} from "./src/config/sort-tracked-items";
import {
    PRICE_CHECKING_INTERVAL,
    SYNCHING_INTERVAL,
    MAX_UNDO_REMOVED_ITEMS,
    UNDO_REMOVED_ITEMS_TIMEOUT
} from "./src/config/background";
import ITEM_STATUS from "./src/config/item-statuses";
import {
    PRICE_UPDATE_ICON,
    PRICE_NOT_FOUND_ICON,
    PRICE_FIX_ICON
} from "./src/config/assets";
import MATCHES from "./src/constants/regexp";
import {
    setDefaultAppearance,
    setTrackedItemAppearance
} from "./src/core/events/appearance";
import {
    syncStorageState
} from "./src/core/events/storage";
import StateManager from "./src/core/state-manager";
import ItemFactory from "./src/core/factories/item";
import sortTrackedItemsBy from "./src/utils/sort-tracked-items";
import {getCanonicalPathFromSource} from "./src/utils/dom";
import {onXHR} from "./src/utils/http";
import {
    toPrice,
    isCanonicalURLRelevant,
    matchesDomain,
    matchesHostname,
    matchesURL,
    parseDomainState,
    captureHostAndPathFromURL,
    captureProtocolHostAndPathFromURL
} from "./src/utils/lang";
import {
    buildSaveConfirmationPayload,
    buildURLConfirmationPayload
} from "./src/utils/view";
import {findURLKey} from "./src/utils/storage";
import onInstalled$ from "./src/core/events/internal/installed";
import onUpdated$ from "./src/core/events/internal/updated";
import onActivatedTab$ from "./src/core/events/activated-tab";
import onCompletedTab$ from "./src/core/events/completed-tab";
import listenNotificationsButtonClicked from "./src/core/events/listen-notifications-buttons-click";

StateManager.initState(SORT_ITEMS_BY_TIME);

function onConfirmURLForCreateItemAttempt(tabId, domain, url, selection, price, faviconURL, faviconAlt, callback) {
    const modalElementId = "price-tag--url-confirmation";
    chrome.tabs.sendMessage(tabId, {
        type: "CONFIRMATION_DISPLAY.CREATE",
        payload: {elementId: modalElementId}
    }, ({status}) => {
        if (status === 1) {
            const {canonicalURL, browserURL} = StateManager.getState();
            const payload = buildURLConfirmationPayload(canonicalURL, browserURL, domain);
            chrome.tabs.sendMessage(tabId, {
                type: "CONFIRMATION_DISPLAY.LOAD",
                payload
            }, ({status, index}) => {
                chrome.tabs.sendMessage(tabId, {
                    type: "CONFIRMATION_DISPLAY.REMOVE",
                    payload: {elementId: modalElementId}
                });

                const {canonicalURL, browserURL} = StateManager.getState();

                switch (status) {
                    case 1:
                        switch (index) {
                            case 0:
                                // said Yes, can use canonical and remember this option
                                chrome.storage.local.get([domain], result => {
                                    const domainState = result && result[domain] && JSON.parse(result[domain]) || {};
                                    domainState._canUseCanonical = true;
                                    chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                    const {canonicalURL} = StateManager.getState();
                                    StateManager.updateCurrentURL(canonicalURL);
                                    callback(true, true);
                                });
                                break;
                            case 1:
                                // said Yes, but use canonical just this time
                                StateManager.updateCurrentURL(canonicalURL);
                                callback(true, true);
                                break;
                            case 2:
                                // said No, use browser URL and remember this option
                                chrome.storage.local.get([domain], result => {
                                    const domainState = result && result[domain] && JSON.parse(result[domain]) || {};
                                    domainState._canUseCanonical = false;
                                    chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                    const {browserURL} = StateManager.getState();
                                    StateManager.updateCurrentURL(browserURL);
                                    callback(true, false);
                                });
                                break;
                            case 3:
                                // said No, use browser URL but ask again
                                StateManager.updateCurrentURL(browserURL);
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
    const {currentURL, domain} = StateManager.getState();
    if (status > 0) {
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State, State.faviconURL || faviconURL);
        canDisplayURLConfirmation(State, domain, canDisplay => {
            if (canDisplay) {
                onConfirmURLForCreateItemAttempt(tabId, domain, currentURL, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
                    if (canSave) {
                        const State = StateManager.getState();
                        const url = useCaninocal ? State.canonicalURL : State.browserURL;
                        checkForURLSimilarity(tabId, domain, url, isToSave => {
                            if (isToSave) {
                                const State = StateManager.getState();
                                createItem(domain, url, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
                                updateExtensionAppearance(domain, url, true);
                            }
                        });
                    }
                });
            } else {
                checkForURLSimilarity(tabId, domain, currentURL, isToSave => {
                    if (isToSave) {
                        const State = StateManager.getState();
                        createItem(domain, currentURL, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
                        updateExtensionAppearance(domain, currentURL, true);
                    }
                });
            }
        });

        StateManager.disableRecord();
    }
}

function onRecordCancel() {
    StateManager.disableRecord();
}

function onAutoSaveCheckStatus(sendResponse, {status, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State.faviconURL || faviconURL);
        StateManager.setSelectionInfo(selection, price, State.faviconURL, faviconAlt);
        sendResponse(true);
    } else {
        sendResponse(false);
    }
}

function onPriceUpdateCheckStatus(sendResponse, trackedPrice, {status, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State.faviconURL || faviconURL);
        StateManager.setSelectionInfo(selection, price, State.faviconURL, faviconAlt);
        if (toPrice(price) !== trackedPrice) {
            sendResponse(true);
            return;
        }
    }

    sendResponse(false);
}

function onSimilarElementHighlight({status, isHighlighted: isSimilarElementHighlighted, originalBackgroundColor = null}) {
    if (status >= 0) {
        StateManager.setSimilarElementHighlight(isSimilarElementHighlighted, originalBackgroundColor);
    }
}

function createItem(domain, url, selection, price, faviconURL, faviconAlt, statuses, callback) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        items[url] = ItemFactory.createItem(selection, toPrice(price), null, faviconURL, faviconAlt, statuses);

        chrome.storage.local.set({[domain]: JSON.stringify(items)}, () => {
            StateManager.disableAutoSave();
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

function checkForPriceChanges() {
    chrome.storage.local.get(null, result => {
        for (let domain in result) {
            if (result.hasOwnProperty(domain) && matchesDomain(domain)) {
                const domainItems = JSON.parse(result[domain]);

                for (let url in domainItems) {
                    if (domainItems.hasOwnProperty(url) && matchesURL(url)) {
                        const item = ItemFactory.createItemFromObject(domainItems[url]);
                        if (item.isWatched()) {
                            const {price: targetPrice, currentPrice} = item;
                            onXHR(url, template => {
                                try {
                                    let newPrice = null;
                                    const {textContent} = template.querySelector(domainItems[url].selection);
                                    if (textContent) {
                                        const textContentMatch = textContent.match(MATCHES.PRICE);
                                        if (textContentMatch) {
                                            [, newPrice] = textContentMatch;

                                            newPrice = toPrice(newPrice);

                                            if (!targetPrice) {
                                                item.updateTrackStatus(newPrice,
                                                    [ITEM_STATUS.FIXED], [ITEM_STATUS.NOT_FOUND]);
                                                domainItems[url] = item;
                                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                    const {notificationsCounter} = StateManager.getState();
                                                    const notificationId = `TRACK.PRICE_FIXED-${notificationsCounter}`;
                                                    createNotification(notificationId, PRICE_FIX_ICON, "Fixed price",
                                                        `Ermm.. We've just fixed a wrongly set price to ${newPrice}`, url, url, domain);
                                                });
                                            } else if (newPrice < currentPrice) {
                                                item.updateCurrentPrice(newPrice);
                                                item.updateTrackStatus(null,
                                                    [ITEM_STATUS.DECREASED],
                                                    [ITEM_STATUS.INCREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_DECREASE]);
                                                domainItems[url] = item;

                                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                    // TODO: sendResponse("done"); // foi actualizado ou não
                                                    if (newPrice < targetPrice && !item.hasAcknowledgeDecrease()) {
                                                        const {notificationsCounter} = StateManager.getState();
                                                        const notificationId = `TRACK.PRICE_UPDATE-${notificationsCounter}`;
                                                        createNotification(notificationId, PRICE_UPDATE_ICON, "Lower price!!",
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
                                                item.updateCurrentPrice(newPrice); // update current price and previous
                                                item.updateTrackStatus(null,
                                                    [ITEM_STATUS.INCREASED],
                                                    [ITEM_STATUS.DECREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_INCREASE]);

                                                domainItems[url] = item;
                                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                    // TODO: sendResponse("done"); // foi actualizado ou não

                                                    if (!item.hasAcknowledgeIncrease()) {
                                                        const {notificationsCounter} = StateManager.getState();
                                                        const notificationId = `TRACK.PRICE_UPDATE-${notificationsCounter}`;
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
                                                        createNotification(notificationId, PRICE_UPDATE_ICON, "Price increase",
                                                            `${newPrice} (previous ${domainItems[url].previousPrice})`, url, url, domain, ITEM_STATUS.INCREASED,
                                                            notificationOptions);
                                                    }
                                                });
                                            } else if (!item.isNotFound()) { // NOTE: Here, price is the same
                                                item.updateTrackStatus(null,
                                                    null, [ITEM_STATUS.NOT_FOUND]);
                                                domainItems[url] = item;
                                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                    // TODO: sendResponse("done"); // foi actualizado ou não
                                                });
                                            } else {
                                                item.updateTrackStatus(null,
                                                    null, [ITEM_STATUS.NOT_FOUND]);
                                                domainItems[url] = item;
                                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
                                            }
                                        }
                                    }

                                    if (item.price && !newPrice) {
                                        if (!item.isNotFound()) {
                                            item.updateTrackStatus(null,
                                                [ITEM_STATUS.NOT_FOUND],
                                                [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);
                                            domainItems[url] = item;
                                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                // TODO: sendResponse("done"); // foi actualizado ou não
                                                const {notificationsCounter} = StateManager.getState();
                                                const notificationId = `TRACK.PRICE_NOT_FOUND-${notificationsCounter}`;
                                                const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                                                createNotification(notificationId, PRICE_NOT_FOUND_ICON, "Price gone",
                                                    `Price tag no longer found${previousPrice}`, url, url, domain);
                                            });
                                        }
                                    }
                                } catch (e) {
                                    if (!item.isNotFound()) {
                                        console.warn(`Invalid price selection element in\n${url}:\t"${domainItems[url].selection}"`);
                                        item.updateTrackStatus(null,
                                            [ITEM_STATUS.NOT_FOUND],
                                            [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);
                                        domainItems[url] = item;

                                        chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                                            const {notificationsCounter} = StateManager.getState();
                                            const notificationId = `TRACK.PRICE_NOT_FOUND-${notificationsCounter}`;
                                            const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                                            createNotification(notificationId, PRICE_NOT_FOUND_ICON, "Price gone",
                                                `Price tag no longer found${previousPrice}`, url, url, domain);
                                        });
                                    }
                                }
                            });
                        }
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
                        if (matchesHostname(url)) {
                            const item = ItemFactory.createItemFromObject(domainItems[url]);
                            if (item.isWatched()) {
                                items.push({
                                    ...item,
                                    url
                                });
                            }
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
                const item = domainItems[url] && ItemFactory.createItemFromObject(domainItems[url]);
                if (item) {
                    found = true;

                    const {_undoRemovedItemsResetTask} = StateManager.getState();
                    if (_undoRemovedItemsResetTask) {
                        clearTimeout(_undoRemovedItemsResetTask);
                        StateManager.setUndoRemovedItemsResetTask(null);
                    }

                    const removedItem = {...item};
                    StateManager.addUndoRemovedItem(url, removedItem, MAX_UNDO_REMOVED_ITEMS);
                    chrome.runtime.sendMessage({
                        type: "TRACKED_ITEMS.UNDO_STATUS",
                        payload: {isUndoStatusActive: true}
                    });

                    const undoRemovedItemsTask = setTimeout(() => {
                        StateManager.resetUndoRemovedItems();
                        chrome.runtime.sendMessage({
                            type: "TRACKED_ITEMS.UNDO_STATUS",
                            payload: {isUndoStatusActive: false}
                        });
                    }, UNDO_REMOVED_ITEMS_TIMEOUT);

                    StateManager.setUndoRemovedItemsResetTask(undoRemovedItemsTask);

                    item.updateTrackStatus(null, null, [ITEM_STATUS.WATCHED]); // stop watching
                    domainItems[url] = item;
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
                const item = domainItems[url] && ItemFactory.createItemFromObject(domainItems[url]);
                if (item) {
                    found = true;

                    item.updateTrackStatus(null, [ITEM_STATUS.WATCHED], null); // start watch again
                    domainItems[url] = item;
                    chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                        if (currentURL === url) {
                            updateAutoSaveStatus(url, domain);
                            updatePriceUpdateStatus(url, domain);
                            updateExtensionAppearance(domain, url, true);
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
            const {notifications} = StateManager.getState();
            const {domain, url, type} = notifications[notifId];
            chrome.storage.local.get([domain], result => {
                const domainItems = result && result[domain] ? JSON.parse(result[domain]) : null;
                const item = ItemFactory.createItemFromObject(domainItems[url]);
                switch (type) {
                    case ITEM_STATUS.DECREASED:
                        item.updateTrackStatus(null, [ITEM_STATUS.ACK_DECREASE]);
                        break;
                    case ITEM_STATUS.INCREASED:
                        item.updateTrackStatus(null, [ITEM_STATUS.ACK_INCREASE]);
                        break;
                }

                domainItems[url] = item;

                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
            });
        }

        StateManager.deleteNotificationsItem(notifId);
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
        StateManager.updateNotificationsItem(id, {
            url,
            domain,
            type
        });
    });

    StateManager.incrementNotificationsCounter();
}

function setupTrackingPolling() {
    checkForPriceChanges();
    setInterval(checkForPriceChanges, PRICE_CHECKING_INTERVAL);
}

function updateAutoSaveStatus(url, domain, fullURL) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        const item = items[url] && ItemFactory.createItemFromObject(items[url]);
        const itemFallback = items[fullURL] && ItemFactory.createItemFromObject(items[fullURL]);

        const isItemDefinedAndWatched = (item && item.isWatched()) ||
            (itemFallback && itemFallback.isWatched());
        if (items && !isItemDefinedAndWatched) {
            const urlFromDomain = findURLKey(items);
            const exampleFromDomain = items[urlFromDomain] && ItemFactory.createItemFromObject(items[urlFromDomain]);
            if (exampleFromDomain && exampleFromDomain.selection) {
                StateManager.enableAutoSave(exampleFromDomain.selection);
            }
        } else {
            StateManager.disableAutoSave();
        }
    });
}

function updatePriceUpdateStatus(url, domain, fullURL) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        const item = (items[url] && ItemFactory.createItemFromObject(items[url])) ||
            (items[fullURL] && ItemFactory.createItemFromObject(items[fullURL]));
        const hasItemPriceIncOrDec = item && item.price !== item.currentPrice;
        if (hasItemPriceIncOrDec) {
            StateManager.enablePriceUpdate(item.selection);
        } else {
            StateManager.disablePriceUpdate();
        }
    });
}

function updateExtensionAppearance(currentDomain, currentURL, forcePageTrackingTo, fullURL) {
    if (forcePageTrackingTo === true) {
        setTrackedItemAppearance();
        StateManager.enableCurrentPageTracked();
    } else if (forcePageTrackingTo === false) {
        setDefaultAppearance();
        StateManager.disableCurrentPageTracked();
    } else if (!forcePageTrackingTo) {
        chrome.storage.local.get([currentDomain], result => {
            const domainState = parseDomainState(result, currentDomain);
            if (domainState) {
                // NOTE: Making sure that full URL is also checked because item may have been saved with full URL
                // in the past
                const itemObject = domainState[currentURL] || domainState[fullURL];
                const item = itemObject && ItemFactory.createItemFromObject(itemObject);
                if (item && item.isWatched()) {
                    setTrackedItemAppearance();
                    StateManager.enableCurrentPageTracked();
                } else {
                    setDefaultAppearance();
                    StateManager.disableCurrentPageTracked();
                }
            } else {
                setDefaultAppearance();
                StateManager.disableCurrentPageTracked();
            }
        });
    }
}

function searchForEqualPathWatchedItem(domainState, currentURL, callback) {
    const currentHostAndPath = captureHostAndPathFromURL(currentURL);
    let foundOne = false;
    for (let url in domainState) {
        if (domainState.hasOwnProperty(url) && matchesURL(url)) {
            const item = ItemFactory.createItemFromObject(domainState[url]);
            if (item.isWatched()) {
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

function onTabContextChange(tabId, url) {
    const captureDomain = url.match(MATCHES.CAPTURE.DOMAIN_IN_URL);
    if (captureDomain) {
        const [, domain] = captureDomain;
        StateManager.updateCurrentDomain(domain);
        chrome.storage.local.get([domain], result => {
            const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
            // check if user has already a preference to use the canonical URL if available
            if (domainState && domainState._canUseCanonical === false) {
                StateManager.updateCanonicalURL(null);
                StateManager.updateCurrentURL(url);
                StateManager.updateBrowserURL(url);

                if (domainState._isPathEnoughToTrack === true) {
                    const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                    if (protocolHostAndPathFromURL) {
                        StateManager.updateCurrentURL(protocolHostAndPathFromURL);
                        StateManager.updateBrowserURL(protocolHostAndPathFromURL);
                    }
                }

                const State = StateManager.getState();
                updateAutoSaveStatus(State.currentURL, State.domain, url);
                updatePriceUpdateStatus(State.currentURL, State.domain, url);
                updateExtensionAppearance(State.domain, State.currentURL, null, url);
            } else {
                // First thing to do, check:
                // If canonical was updated (compared to the previously) + if it's relevant
                StateManager.updateBrowserURL(url);

                onXHR(url, template => {
                    const canonicalURL = getCanonicalPathFromSource(template);
                    const canUseCanonical = isCanonicalURLRelevant(canonicalURL);

                    if (canUseCanonical) {
                        StateManager.updateCurrentURL(canonicalURL);
                        StateManager.updateCanonicalURL(canonicalURL);
                    } else {
                        StateManager.updateCanonicalURL(null);
                        StateManager.updateCurrentURL(url);

                        if (domainState && domainState._isPathEnoughToTrack === true) {
                            const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                            if (protocolHostAndPathFromURL) {
                                StateManager.updateCurrentURL(protocolHostAndPathFromURL);
                                StateManager.updateBrowserURL(protocolHostAndPathFromURL);
                            }
                        }
                    }

                    const State = StateManager.getState();
                    updateAutoSaveStatus(State.currentURL, State.domain, url);
                    updatePriceUpdateStatus(State.currentURL, State.domain, url);
                    updateExtensionAppearance(State.domain, State.currentURL, null, url);
                });
            }
        });
    }
}

// TODO: break this down into smaller functions
function attachEvents() {
    onInstalled$().subscribe(() => {
        console.log("Price tag installed.");
    });

    onActivatedTab$().subscribe(({id, url}) => {
        if (url.startsWith("http")) {
            onTabContextChange(id, url);
            const State = StateManager.getState();
            StateManager.updateFaviconURL(State._faviconURLMap[id] || null);
        } else {
            setDefaultAppearance();
        }
    });

    onUpdated$().subscribe(({tabId, favIconUrl, active, url}) => {
        if (url.startsWith("http")) {
            if (active && favIconUrl) {
                StateManager.updateFaviconURLMapItem(tabId, favIconUrl);
                StateManager.updateFaviconURL(favIconUrl);
            }
        } else {
            setDefaultAppearance();
        }
    });

    onCompletedTab$().subscribe(({id, url}) => {
        const State = StateManager.getState();
        if (url !== State.browserURL) {
            onTabContextChange(id, url);
        }
    });

    chrome.runtime.onMessage.addListener(
        ({type, payload = {}}, sender, sendResponse) => {
            let isUndoStatusActive;
            const {id, url: itemUrl, sortByType} = payload;
            const {recordActive, autoSaveEnabled, isPriceUpdateEnabled, currentURL: url, domain, _sortItemsBy, _undoRemovedItems} = StateManager.getState();
            switch (type) {
                case "POPUP.STATUS":
                    sendResponse({status: 1, state: {recordActive, autoSaveEnabled, isPriceUpdateEnabled}});
                    break;
                case "RECORD.ATTEMPT":
                    StateManager.toggleRecord();

                    if (recordActive) {
                        const {url} = payload;
                        chrome.tabs.sendMessage(id, {
                            type: "RECORD.START",
                            payload: {url}
                        }, onRecordDone.bind(null, id));
                    } else {
                        chrome.tabs.sendMessage(id, {type: "RECORD.CANCEL"}, onRecordCancel);
                    }
                    sendResponse({status: 1, state: {recordActive}});
                    break;
                case "AUTO_SAVE.STATUS":
                    chrome.storage.local.get([domain], result => {
                        const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
                        if (domainState) {
                            if (domainState._isPathEnoughToTrack === true) {
                                // since it's true we can say that that domain items' path is enough to track items in this domain
                                searchForEqualPathWatchedItem(domainState, url, similarURL => {
                                    if (!similarURL) {
                                        const State = StateManager.getState();
                                        chrome.tabs.sendMessage(id, {
                                            type: "AUTO_SAVE.CHECK_STATUS",
                                            payload: {url, selection: State.selection}
                                        }, onAutoSaveCheckStatus.bind(null, sendResponse));
                                    } else {
                                        sendResponse({status: -1});
                                    }
                                });
                            } else {
                                const State = StateManager.getState();
                                chrome.tabs.sendMessage(id, {
                                    type: "AUTO_SAVE.CHECK_STATUS",
                                    payload: {url, selection: State.selection}
                                }, onAutoSaveCheckStatus.bind(null, sendResponse));
                            }
                        } else {
                            // domain doesn't exist
                            const State = StateManager.getState();
                            chrome.tabs.sendMessage(id, {
                                type: "AUTO_SAVE.CHECK_STATUS",
                                payload: {url, selection: State.selection}
                            }, onAutoSaveCheckStatus.bind(null, sendResponse));
                        }
                    });
                    return true;
                case "AUTO_SAVE.ATTEMPT":
                    if (autoSaveEnabled) {
                        const {domain, currentURL: stateUrl, selection, price, faviconURL, faviconAlt, originalBackgroundColor} = State;

                        canDisplayURLConfirmation(StateManager.getState(), domain, canDisplay => {
                            if (canDisplay) {
                                onConfirmURLForCreateItemAttempt(id, domain, stateUrl, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
                                    if (canSave) {
                                        const State = StateManager.getState();
                                        const url = useCaninocal ? State.canonicalURL : State.browserURL;

                                        checkForURLSimilarity(id, domain, url, (isToSave, autoSaveStatus) => {
                                            if (isToSave) {
                                                createItem(domain, url, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED], () => {
                                                    chrome.tabs.sendMessage(id, {
                                                        type: "PRICE_TAG.HIGHLIGHT.STOP",
                                                        payload: {selection, originalBackgroundColor}
                                                    }, onSimilarElementHighlight);

                                                    updateExtensionAppearance(domain, url, true);
                                                    StateManager.disableAutoSave();

                                                    sendResponse(false);
                                                });
                                            } else {
                                                // For Exceptions (including when there's similar item - should be caught by "AUTO_SAVE.STATUS")
                                                if (!autoSaveStatus) {
                                                    StateManager.disableAutoSave();
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
                                            StateManager.disableAutoSave();

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
                    if (autoSaveEnabled) {
                        const {selection} = StateManager.getState();
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.START",
                            payload: {selection}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "AUTO_SAVE.HIGHLIGHT.PRE_STOP":
                    if (autoSaveEnabled) {
                        const {selection, originalBackgroundColor} = StateManager.getState();
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.STOP",
                            payload: {selection, originalBackgroundColor}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "PRICE_UPDATE.STATUS":
                    chrome.storage.local.get([domain], result => {
                        const State = StateManager.getState();
                        const domainItems = result && result[State.domain] ? JSON.parse(result[State.domain]) : {};
                        const item = (domainItems[State.currentURL] && ItemFactory.createItemFromObject(domainItems[State.currentURL])) ||
                            (domainItems[State.browserURL] && ItemFactory.createItemFromObject(domainItems[State.browserURL]));
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
                    if (isPriceUpdateEnabled) {
                        const {selection, price: updatedPrice, originalBackgroundColor} =
                            StateManager.getState();
                        const price = updatedPrice && toPrice(updatedPrice);
                        chrome.storage.local.get([domain], result => {
                            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};

                            const item = ItemFactory.createItemFromObject(domainItems[url]);

                            item.updateTrackStatus(price,
                                null,
                                [
                                    ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE,
                                    ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED,
                                    ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE,
                                    ITEM_STATUS.DECREASED, ITEM_STATUS.DECREASED,
                                    ITEM_STATUS.NOT_FOUND
                                ]);
                            item.updateDiffPercentage();

                            domainItems[url] = item;
                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});

                            chrome.tabs.sendMessage(id, {
                                type: "PRICE_TAG.HIGHLIGHT.STOP",
                                payload: {selection, originalBackgroundColor}
                            }, onSimilarElementHighlight);

                            StateManager.disablePriceUpdate();
                            sendResponse(false);
                        });
                    }
                    return true;
                case "PRICE_UPDATE.HIGHLIGHT.PRE_START":
                    if (isPriceUpdateEnabled) {
                        const {selection} = StateManager.getState();
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.START",
                            payload: {selection}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "PRICE_UPDATE.HIGHLIGHT.PRE_STOP":
                    if (isPriceUpdateEnabled) {
                        const {selection, originalBackgroundColor} = StateManager.getState();
                        chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.STOP",
                            payload: {selection, originalBackgroundColor}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "TRACKED_ITEMS.OPEN":
                    /* eslint-disable no-case-declarations */
                    const State = StateManager.updateSortItemsBy(SORT_ITEMS_BY_TIME);
                    /* eslint-enable no-case-declarations */
                    isUndoStatusActive = State._undoRemovedItems.length > 0;
                    sendResponse({isUndoStatusActive});
                    break;
                case "TRACKED_ITEMS.GET":
                    getTrackedItemsSortedBy(_sortItemsBy, sendResponse);
                    return true;
                case "TRACKED_ITEMS.UNFOLLOW":
                    removeTrackedItem(itemUrl, url, sendResponse);
                    return true;
                case "TRACKED_ITEMS.CHANGE_SORT":
                    StateManager.updateSortItemsBy(SORT_BY_TYPES[sortByType]);
                    break;
                case "TRACKED_ITEMS.UNDO_ATTEMPT":
                    if (_undoRemovedItems.length > 0) {
                        const undoRemovedItem = StateManager.getUndoRemovedItemsHead();

                        undoRemoveTrackedItem(undoRemovedItem.url, State.currentURL, response => {
                            if (response) {
                                const {_undoRemovedItems} = StateManager.removeUndoRemovedItem(State);
                                _undoRemovedItems.length === 0 ?
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
        const {notifications} = StateManager.getState();
        chrome.tabs.create({url: notifications[notifId].url});
        clearNotification(notifId);
    });

    // TODO: test this
    listenNotificationsButtonClicked().subscribe();

    // TODO: update and keep tracking
    /*chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
        const {domain, url, type} = State.notifications[notifId];
        switch (buttonIndex) {
            case 0:
                switch (type) {
                    case ITEM_STATUS.DECREASED:
                        chrome.storage.local.get([domain], result => {
                            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
                            if (domainItems[url]) {
                                const item = ItemFactory.createItemFromObject(domainItems[url]);
                                const newPrice = item.price;
                                item.updateTrackStatus(newPrice, null, [ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE], true);
                                domainItems[url] = item;
                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
                            }
                        });
                        break;
                    case ITEM_STATUS.INCREASED:
                        chrome.storage.local.get([domain], result => {
                            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
                            if (domainItems[url]) {
                                const item = ItemFactory.createItemFromObject(domainItems[url]);
                                item.updateTrackStatus(item.previousPrice, null, [ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE], true);
                                domainItems[url] = item;
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
                                const item = ItemFactory.createItemFromObject(domainItems[url]);
                                item.updateTrackStatus(null, null, ITEM_STATUS.ALL_STATUSES); // stop watching
                                domainItems[url] = item;
                                chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});
                            }
                        });
                        break;
                }
                break;
        }
    });*/

    chrome.notifications.onClosed.addListener(clearNotification);
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
