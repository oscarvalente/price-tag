let State = {
    recordActive: false,
    notifications: {},
    notificationsCounter: 0,
    autoSaveEnabled: false,
    isPriceUpdateEnabled: false,
    selection: null,
    isSimilarElementHighlighted: false,
    originalBackgroundColor: null,
    isCurrentPageTracked: false,
    faviconURL: null,
    _faviconURLMap: {},
    currentURL: null,
    canonicalURL: null,
    browserURL: null,
    domain: null
};

const DEFAULT_ICON = "assets/icon_48.png";
const TRACKED_ITEM_ICON = "assets/icon_active_48.png";
const DEFAULT_TITLE = "Price Tag";
const TRACKED_ITEM_TITLE = "Price Tag - This item is being tracked";

const PRICE_CHECKING_INTERVAL = 180000;
// const PRICE_CHECKING_INTERVAL = 10000;
const SYNCHING_INTERVAL = 120000;
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

function toUnique(array) {
    return Array.from(new Set(array));
}

function updateItemCurrentPrice(item, newPrice) {
    const previousPrice = item.currentPrice;

    const newItem = {
        ...item,
        previousPrice,
        currentPrice: newPrice
    };

    const diff = Math.abs(newItem.currentPrice - newItem.price) * 100 / newItem.price;
    const diffPerc = parseFloat(diff.toFixed(2));
    let diffPercentage = null;
    if (diffPerc) {
        diffPercentage = newItem.currentPrice > newItem.price ?
            +diffPerc :
            -diffPerc;

        if (diffPercentage > 0 && diffPercentage < 1) {
            diffPercentage = Math.ceil(diffPercentage);
        } else if (diffPercentage > -1 && diffPercentage < 0) {
            diffPercentage = Math.floor(diffPercentage);
        }
    }

    newItem.diffPercentage = diffPercentage;

    return newItem;
}

function updateItemTrackStatus(item, newPrice, statusesToAdd, statusesToRemove, forceStartingPrice = false) {
    if (!statusesToAdd) {
        statusesToAdd = [];
    }

    if (!statusesToRemove) {
        statusesToRemove = [];
    }

    const statuses = toUnique([...removeStatuses(item, statusesToRemove), ...statusesToAdd]);
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

                if (status === 1) {
                    switch (index) {
                        case 0:
                            // said Yes, can use canonical and remember this option
                            chrome.storage.local.get([domain], result => {
                                const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
                                domainState._canUseCanonical = true;
                                chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                State = updateCurrentURL(State, State.canonicalURL);
                                callback(true, true);
                            });
                            break;
                        case 1:
                            // said Yes, but use canonical just this time
                            State = updateCurrentURL(State, State.canonicalURL);
                            callback(true, true);
                            break;
                        case 2:
                            // said No, use browser URL and remember this option
                            chrome.storage.local.get([domain], result => {
                                const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
                                domainState._canUseCanonical = false;
                                chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                State = updateCurrentURL(State, State.browserURL);
                                callback(true, false);
                            });
                            break;
                        default:
                            // cannot recognize this modal button click
                            callback(false);
                            break;
                    }
                }
            });
        }
    });
}

function onRecordDone(tabId, payload) {
    const {status, selection, price, faviconURL, faviconAlt} = payload;
    const {currentURL, domain} = State;
    if (status > 0) {
        State = updateFaviconURL(State, State.faviconURL || faviconURL);
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

        State = disableRecord(State);
    }
}

function onRecordCancel() {
    State = disableRecord(State);
}

function onAutoSaveCheckStatus(sendResponse, {status, url, domain, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        State = updateFaviconURL(State, State.faviconURL || faviconURL);
        State = setSelectionInfo(State, selection, price, State.faviconURL, faviconAlt);
        sendResponse(true);
    } else {
        sendResponse(false);
    }
}

function onPriceUpdateCheckStatus(sendResponse, trackedPrice, {status, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        State = updateFaviconURL(State, State.faviconURL || faviconURL);
        State = setSelectionInfo(State, selection, price, State.faviconURL, faviconAlt);
        if (toPrice(price) !== trackedPrice) {
            sendResponse(true);
            return;
        }
    }

    sendResponse(false);
}

function onSimilarElementHighlight({status, isHighlighted: isSimilarElementHighlighted, originalBackgroundColor = null}) {
    if (status >= 0) {
        State = setSimilarElementHighlight(State, isSimilarElementHighlighted, originalBackgroundColor);
    }
}

function createTrackedItem(selection, trackedPrice, previousPrice, faviconURL, faviconAlt, statuses) {
    if (!previousPrice) {
        previousPrice = null;
    }

    const price = toPrice(trackedPrice);

    return {
        selection,
        price,
        currentPrice: price,
        startingPrice: price,
        previousPrice,
        faviconURL,
        faviconAlt,
        timestamp: new Date().getTime(),
        statuses
    };
}

// TODO: price becomes a class
function createItem(domain, url, selection, price, faviconURL, faviconAlt, statuses, callback) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        items[url] = createTrackedItem(selection, price, undefined, faviconURL, faviconAlt, statuses);

        chrome.storage.local.set({[domain]: JSON.stringify(items)}, () => {
            State = disableAutoSave(State);
            if (callback) {
                callback();
            }
            // TODO: sendResponse("done"); // foi gravado ou não
        });
    });
}

function toggleRecord(state) {
    return {
        ...state,
        recordActive: !state.recordActive
    }
}

function disableRecord(state) {
    return {
        ...state,
        recordActive: false
    }
}

function disableCurrentPageTracked(state) {
    return {
        ...state,
        isCurrentPageTracked: false
    };
}

function enableCurrentPageTracked(state) {
    return {
        ...state,
        isCurrentPageTracked: true
    };
}

function updateCurrentDomain(state, domain) {
    return {
        ...state,
        domain
    };
}

function updateCurrentURL(state, currentURL) {
    return {
        ...state,
        currentURL
    };
}

function updateCanonicalURL(state, canonicalURL) {
    return {
        ...state,
        canonicalURL
    };
}

function updateBrowserURL(state, browserURL) {
    return {
        ...state,
        browserURL
    };
}

function updateFaviconURL(state, faviconURL) {
    return {
        ...state,
        faviconURL
    };
}

function updateFaviconURLMapItem(state, tabId, faviconURL) {
    return {
        ...state,
        _faviconURLMap: {
            ...state._faviconURLMap,
            [tabId]: faviconURL
        }
    };
}

function incrementNotificationsCounter(state) {
    const notificationsCounter = state.notificationsCounter + 1;
    return {
        ...state,
        notificationsCounter
    }
}

function deleteNotificationsItem(state, notificationId) {
    const newState = {...state};
    delete newState.notifications[notificationId];
    return newState;
}

function updateNotificationsItem(state, notificationId, notificationState) {
    return {
        ...state,
        notifications: {
            ...state.notifications,
            [notificationId]: notificationState
        }
    };
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

function enableAutoSave(state, selection) {
    selection = selection || state.selection;
    return {
        ...state,
        autoSaveEnabled: true,
        selection
    };
}

function disableAutoSave(state) {
    return {
        ...state,
        autoSaveEnabled: false
    };
}

function enablePriceUpdate(state, selection) {
    return {
        ...state,
        isPriceUpdateEnabled: true,
        selection
    };
}

function disablePriceUpdate(state) {
    return {
        ...state,
        isPriceUpdateEnabled: false
    };
}

function setSelectionInfo(state, selection, price, faviconURL, faviconAlt) {
    return {
        ...state,
        selection,
        price,
        faviconURL,
        faviconAlt
    };
}

function setSimilarElementHighlight(state, isSimilarElementHighlighted, originalBackgroundColor) {
    return {
        ...state,
        isSimilarElementHighlighted,
        originalBackgroundColor
    };
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
                                const textContent = template.querySelector(domainItems[url].selection).textContent;
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

function getTrackedItems(callback) {
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
        trackedItems.sort(sortItemsByTime);
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

                    domainItems[url] = updateItemTrackStatus(domainItems[url], null, null, ALL_ITEM_STATUSES); // stop watching
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

        State = deleteNotificationsItem(State, notifId);
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
        State = updateNotificationsItem(State, id, {
            url,
            domain,
            type
        });
    });

    State = incrementNotificationsCounter(State);
}

function toPrice(price) {
    const priceNumber = parseFloat(price.replace(",", "."));
    const formattedPrice = priceNumber.toFixed(2);
    return parseFloat(formattedPrice);
}

function createHTMLTemplate(html) {
    var template = document.createElement("template");
    html = html.trim();
    template.innerHTML = html;
    return template.content;
}

function isCanonicalURLRelevant(canonical) {
    return canonical && matchesHostnameAndPath(canonical);
}

function wasCanonicalUpdated(state, canonicalURL) {
    return !state.canonicalURL || (state.canonicalURL !== canonicalURL);
}

function sortItemsByTime({timestamp: tsA}, {timestamp: tsB}) {
    return tsA - tsB;
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
    // TODO: remove settimeout (for test purposes)
    // setTimeout(checkForPriceChanges, 20000);
    setInterval(checkForPriceChanges, PRICE_CHECKING_INTERVAL);
}

function updateAutoSaveStatus(url, domain) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        const isItemNullOrUnwatched = !items[url] || !isWatched(items[url]);
        if (items && isItemNullOrUnwatched) {
            const urlFromDomain = Object.keys(items)[0];
            if (items[urlFromDomain] && items[urlFromDomain].selection) {
                State = enableAutoSave(State, items[urlFromDomain].selection);
            }
        } else {
            State = disableAutoSave(State);
        }
    });
}

function updatePriceUpdateStatus(url, domain) {
    chrome.storage.local.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        const item = items[url];
        const hasItemPriceIncOrDec = item && item.price !== item.currentPrice;
        if (hasItemPriceIncOrDec) {
            State = enablePriceUpdate(State, item.selection);
        } else {
            State = disablePriceUpdate(State);
        }
    });
}

function updateExtensionAppearance(currentDomain, currentURL, forcePageTrackingTo) {
    if (forcePageTrackingTo === true) {
        setTrackedItemAppearance();
        State = enableCurrentPageTracked(State);
    } else if (forcePageTrackingTo === false) {
        setDefaultAppearance();
        State = disableCurrentPageTracked(State);
    } else if (!forcePageTrackingTo) {
        // TODO: Fix bug - if domain has (_isPathEnoughToTrack === true) then ALSO try to use the path only URL
        // TODO: (cont.) However the currentURL needs to be used too because user may have chosen the path is enough
        // TODO: not on the first item to be tracked in this domain
        chrome.storage.local.get([currentDomain], result => {
            const domainState = parseDomainState(result, currentDomain);
            if (domainState) {
                const item = domainState[currentURL];
                if (item && isWatched(item)) {
                    setTrackedItemAppearance();
                    State = enableCurrentPageTracked(State);
                } else {
                    setDefaultAppearance();
                    State = disableCurrentPageTracked(State);
                }
            } else {
                setDefaultAppearance();
                State = disableCurrentPageTracked(State);
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
        message: "It appears that the item URL you're trying to save:\n" +
            `${currentURL}\n` +
            "is pretty similar to\n" +
            `${similarURL}\n\n` +
            "Please help us helping you by choosing one of the following options:",
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
        message: `${domain} says that a more accurate URL for this item would be:\n` +
            `${canonicalURL}\n` +
            "If this is correct, we recommend you to follow it.\n" +
            "However you can still opt to choose following the current browser URL:\n" +
            `${browserURL}\n\n` +
            "Since your choice will affect the way items are tracked futurely,\nplease help us helping you by choosing carefully one of the following options:",
        buttons: ["Use recommended URL. Remember this option for this site", "Use recommended URL, but just this time", "It's not correct. Use the current browser URL instead"]
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

                        // TODO: Currently this is limited, it needs:
                        // TODO: Option to say "if URL differs then item is different, stop annoying me!"

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
                                    if (status === 1) {
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
                                    } else {
                                        // something in buttons click
                                        callback(false, true);
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

function getCanonicalPathFromSource(source) {
    const canonicalElement = source.querySelector("link[rel=\"canonical\"]");
    return canonicalElement && canonicalElement.getAttribute("href");
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
        State = updateCurrentDomain(State, domain);
        chrome.storage.local.get([domain], result => {
            const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
            // check if user has already a preference to use the canonical URL if available
            if (domainState && domainState._canUseCanonical === false) {
                State = updateCanonicalURL(State, null);
                State = updateCurrentURL(State, url);
                State = updateBrowserURL(State, url);

                if (domainState._isPathEnoughToTrack === true) {
                    const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                    if (protocolHostAndPathFromURL) {
                        State = updateCurrentURL(State, protocolHostAndPathFromURL);
                        State = updateBrowserURL(State, protocolHostAndPathFromURL);
                    }
                }

                updateAutoSaveStatus(State.currentURL, State.domain);
                updatePriceUpdateStatus(State.currentURL, State.domain);
                updateExtensionAppearance(State.domain, State.currentURL);
            } else {
                // First thing to do, check:
                // If canonical was updated (compared to the previously) + if it's relevant
                State = updateBrowserURL(State, url);

                onXHR(url, template => {
                    const canonicalURL = getCanonicalPathFromSource(template);
                    const canUseCanonical = isCanonicalURLRelevant(canonicalURL);

                    if (canUseCanonical) {
                        State = updateCurrentURL(State, canonicalURL);
                        State = updateCanonicalURL(State, canonicalURL);
                    } else {
                        State = updateCanonicalURL(State, null);
                        State = updateCurrentURL(State, url);

                        if (domainState && domainState._isPathEnoughToTrack === true) {
                            const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                            if (protocolHostAndPathFromURL) {
                                State = updateCurrentURL(State, protocolHostAndPathFromURL);
                                State = updateBrowserURL(State, protocolHostAndPathFromURL);
                            }
                        }
                    }
                    updateAutoSaveStatus(State.currentURL, State.domain);
                    updatePriceUpdateStatus(State.currentURL, State.domain);
                    updateExtensionAppearance(State.domain, State.currentURL);
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
                State = updateFaviconURL(State, State._faviconURLMap[id] || null);
            } else {
                setDefaultAppearance();
            }
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, {status, favIconUrl}, {active, url}) => {
        if (url.startsWith("http")) {
            if (active) {
                if (favIconUrl) {
                    State = updateFaviconURLMapItem(State, tabId, favIconUrl);
                    State = updateFaviconURL(State, favIconUrl);
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
            const {id} = payload;
            switch (type) {
                case "POPUP.STATUS":
                    const {recordActive, autoSaveEnabled, isPriceUpdateEnabled} = State;
                    sendResponse({status: 1, state: {recordActive, autoSaveEnabled, isPriceUpdateEnabled}});
                    break;
                case "RECORD.ATTEMPT":
                    State = toggleRecord(State);

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
                    const {currentURL: url, domain} = State;
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
                                                    State = disableAutoSave(State);

                                                    sendResponse(false);
                                                });
                                            } else {
                                                // For Exceptions (including when there's similar item - should be caught by "AUTO_SAVE.STATUS")
                                                if (!autoSaveStatus) {
                                                    State = disableAutoSave(State);
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
                                            State = disableAutoSave(State);

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

                            chrome.storage.local.set({[domain]: JSON.stringify(domainItems)});

                            chrome.tabs.sendMessage(id, {
                                type: "PRICE_TAG.HIGHLIGHT.STOP",
                                payload: {selection, originalBackgroundColor}
                            }, onSimilarElementHighlight);

                            State = disablePriceUpdate(State);
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
                case "TRACKED_ITEMS.GET":
                    getTrackedItems(sendResponse);
                    return true;
                case "TRACKED_ITEMS.UNFOLLOW":
                    const {url: itemUrl} = payload;
                    removeTrackedItem(itemUrl, State.currentURL, sendResponse);
                    return true;
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

function toStorageStateFormat(state) {
    return Object.keys(state).reduce((newState, domain) => {
        return {
            ...newState,
            [domain]: JSON.stringify(state[domain])
        }
    }, {});
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

                chrome.storage.local.set(toStorageStateFormat(freshState));
                chrome.storage.sync.set(toStorageStateFormat(freshState));
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
