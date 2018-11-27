import {of} from "rxjs";
import {switchMap} from "rxjs/operators";
import isEmpty from "lodash/isEmpty";
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
import {onXHR} from "./src/utils/http";
import {
    toPrice,
    matchesDomain,
    matchesHostname,
    matchesURL
} from "./src/utils/lang";
import {findURLKey} from "./src/utils/storage";
import onInstalled$ from "./src/core/events/internal/installed";
import onUpdated$ from "./src/core/events/internal/updated";
import onActivatedTab$ from "./src/core/events/activated-tab";
import onCompletedTab$ from "./src/core/events/listen-completed-tab";
import listenNotificationsButtonClicked$ from "./src/core/events/listen-notifications-buttons-clicked";
import listenNotificationsClosed$ from "./src/core/events/listen-notifications-closed";
import listenNotificationsClicked$ from "./src/core/events/listen-notifications-clicked";
import createNotification from "./src/core/events/create-custom-notification";
import onTabContextChange$ from "./src/core/events/on-tab-context-change";
import {
    listenPopupStatus as listenPopupStatus$,
    listenRecordAttempt as listenRecordAttempt$,
    listenAutoSaveStatus as listenAutoSaveStatus$,
    listenAutoSaveHighlightPreStart as listenAutoSaveHighlightPreStart$,
    listenAutoSaveHighlightPreStop as listenAutoSaveHighlightPreStop$,
    listenAutoSaveAttempt as listenAutoSaveAttempt$,
    listenPriceUpdateStatus as listenPriceUpdateStatus$,
    listenPriceUpdateAttempt as listenPriceUpdateAttempt$,
    listenPriceUpdateHighlightPreStart as listenPriceUpdateHighlightPreStart$,
    listenPriceUpdateHighlightPreStop as listenPriceUpdateHighlightPreStop$,
    listenTrackedItemsOpen as listenTrackedItemsOpen$
} from "./src/core/events/listen-runtime-messages";

StateManager.initState(SORT_ITEMS_BY_TIME);

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
                                                                        title: "Stop watching"
                                                                    },
                                                                    {
                                                                        title: `Keep tracking but w/ new price (${newPrice})`
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

function removeTrackedItem(url, currentURL, fullURL, callback) {
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
                        if (currentURL === url || fullURL === url) {
                            updateAutoSaveStatus(url, domain, fullURL);
                            updatePriceUpdateStatus(url, domain, fullURL);
                            updateExtensionAppearance(domain, url, false, fullURL);
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

function undoRemoveTrackedItem(url, currentURL, fullURL, callback) {
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
                        if (currentURL === url || fullURL === url) {
                            updateAutoSaveStatus(url, domain, fullURL);
                            updatePriceUpdateStatus(url, domain, fullURL);
                            updateExtensionAppearance(domain, url, true, fullURL);
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
            const domainState = result && result[currentDomain] && JSON.parse(result[currentDomain]) || null;
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

function onStatusAndAppearanceUpdate(statusUpdate = []) {
    if (isEmpty(statusUpdate)) {
        setDefaultAppearance();
    } else {
        const [autoSaveUpdateStatus, priceUpdateStatus, enableTrackedItemAppearance] = statusUpdate;

        if (autoSaveUpdateStatus) {
            const {enable: enableAutoSave, selection} = autoSaveUpdateStatus;
            enableAutoSave ?
                StateManager.enableAutoSave(selection) :
                StateManager.disableAutoSave();
        }

        if (priceUpdateStatus) {
            const {enable: enablePriceUpdate, selection} = priceUpdateStatus;
            enablePriceUpdate ?
                StateManager.enablePriceUpdate(selection) :
                StateManager.disablePriceUpdate();
        }

        if (enableTrackedItemAppearance) {
            setTrackedItemAppearance();
            StateManager.enableCurrentPageTracked();
        } else {
            setDefaultAppearance();
            StateManager.disableCurrentPageTracked();
        }
    }
}

// TODO: break this down into smaller functions
function attachEvents() {
    onInstalled$().subscribe(() => console.log("Price tag installed."));

    onActivatedTab$().pipe(
        switchMap(({id, url}) => {
            if (url.startsWith("http")) {
                const {_faviconURLMap} = StateManager.getState();
                StateManager.updateFaviconURL(_faviconURLMap[id]);
                return onTabContextChange$(id, url);
            } else {
                return of(undefined);
            }
        })
    ).subscribe(onStatusAndAppearanceUpdate);

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

    onCompletedTab$().pipe(
        switchMap(({id, url}) => onTabContextChange$(id, url))
    ).subscribe(onStatusAndAppearanceUpdate);

    listenPopupStatus$().subscribe();
    listenRecordAttempt$().subscribe();
    listenAutoSaveStatus$().subscribe();
    listenAutoSaveHighlightPreStart$().subscribe();
    listenAutoSaveHighlightPreStop$().subscribe();
    listenAutoSaveAttempt$().subscribe();
    listenPriceUpdateStatus$().subscribe();
    listenPriceUpdateAttempt$().subscribe();
    listenPriceUpdateHighlightPreStart$().subscribe();
    listenPriceUpdateHighlightPreStop$().subscribe();
    listenTrackedItemsOpen$(SORT_ITEMS_BY_TIME).subscribe();

    chrome.runtime.onMessage.addListener(
        ({type, payload = {}}, sender, sendResponse) => {
            const {url: itemUrl, sortByType} = payload;
            const {currentURL: url, browserURL, _sortItemsBy, _undoRemovedItems} = StateManager.getState();
            switch (type) {
                case "TRACKED_ITEMS.GET":
                    getTrackedItemsSortedBy(_sortItemsBy, sendResponse);
                    return true;
                case "TRACKED_ITEMS.UNFOLLOW":
                    removeTrackedItem(itemUrl, url, browserURL, sendResponse);
                    return true;
                case "TRACKED_ITEMS.CHANGE_SORT":
                    StateManager.updateSortItemsBy(SORT_BY_TYPES[sortByType]);
                    break;
                case "TRACKED_ITEMS.UNDO_ATTEMPT":
                    if (_undoRemovedItems.length > 0) {
                        const undoRemovedItem = StateManager.getUndoRemovedItemsHead();
                        const State = StateManager.getState();
                        const {currentURL, browserURL} = State;
                        undoRemoveTrackedItem(undoRemovedItem.url, currentURL, browserURL, response => {
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


    listenNotificationsClicked$().subscribe();

    listenNotificationsButtonClicked$().subscribe(hasStoppedWatch => {
        if (hasStoppedWatch) {
            // is case click was "Stop watch"
            const {domain, currentURL} = StateManager.getState();
            updateExtensionAppearance(domain, currentURL, false);
        }
    });

    listenNotificationsClosed$().subscribe();
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
