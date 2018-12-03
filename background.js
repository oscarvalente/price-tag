import {of} from "rxjs";
import {switchMap} from "rxjs/operators";
import {TIME as SORT_ITEMS_BY_TIME} from "./src/config/sort-tracked-items";
import {
    PRICE_CHECKING_INTERVAL,
    SYNCHING_INTERVAL,
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
import {onXHR} from "./src/utils/http";
import {
    toPrice,
    matchesDomain,
    matchesURL
} from "./src/utils/lang";
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
    listenTrackedItemsOpen as listenTrackedItemsOpen$,
    listenTrackedItemsGet as listenTrackedItemsGet$,
    listenTrackedItemsUnfollow as listenTrackedItemsUnfollow$,
    listenTrackedItemsChangeSort as listenTrackedItemsChangeSort$,
    listenTrackedItemsUndoAttempt as listenTrackedItemsUndoAttempt$
} from "./src/core/events/listen-runtime-messages";
import onStatusAndAppearanceUpdate from "./src/core/events/helpers/on-status-and-appearance-update";

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

function setupTrackingPolling() {
    checkForPriceChanges();
    setInterval(checkForPriceChanges, PRICE_CHECKING_INTERVAL);
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
    listenTrackedItemsGet$().subscribe();
    listenTrackedItemsUnfollow$().subscribe();
    listenTrackedItemsChangeSort$().subscribe();
    listenTrackedItemsUndoAttempt$().subscribe();

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
