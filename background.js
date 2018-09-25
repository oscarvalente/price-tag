let State = {
    recordActive: false,
    notifications: {},
    notificationsCounter: 0,
    autoSaveEnabled: false,
    selection: null,
    isSimilarElementHighlighted: false,
    originalBackgroundColor: null,
    isCurrentPageTracked: false,
    faviconURL: null,
    _faviconURLMap: {},
    currentURL: null
};

const DEFAULT_ICON = "assets/icon_48.png";
const TRACKED_ITEM_ICON = "assets/icon_active_48.png";
const DEFAULT_TITLE = "Price Tag";
const TRACKED_ITEM_TITLE = "Price Tag - This item is being tracked";

const CHECKING_INTERVAL = 180000;
// const CHECKING_INTERVAL = 10000;
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
        HOST_AND_PATH: /^https?:\/\/((?:[\w-]+\.)+[\w-]+\w(?:\/[\w-=.]+)+\/?)/,
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

function onRecordDone(payload) {
    const {status, domain, url, selection, price, faviconURL, faviconAlt} = payload;
    if (status > 0) {
        State.faviconURL = State.faviconURL || faviconURL;
        createItem(domain, url, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
        updateExtensionAppearance(domain, url, true);
    }

    State.recordActive = false;
}

function onRecordCancel() {
    State.recordActive = false;
}

function onAutoSaveCheckStatus(sendResponse, {status, url, domain, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        State.faviconURL = State.faviconURL || faviconURL;
        State = setSelectionInfo(State, url, domain, selection, price, State.faviconURL, faviconAlt);
        sendResponse(true);
    } else {
        sendResponse(false);
    }
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

function disableCurrentPageTracked() {
    State.isCurrentPageTracked = false;
}

function enableCurrentPageTracked() {
    State.isCurrentPageTracked = true;
}

function updateCurrentURL(url) {
    State.currentURL = url;
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

function setSelectionInfo(state, url, domain, selection, price, faviconURL, faviconAlt) {
    return {
        ...state,
        url,
        domain,
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
                    if (domainItems.hasOwnProperty(url) && isWatched(domainItems[url])) {
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
                    // TODO: change status instead of deleting

                    domainItems[url] = updateItemTrackStatus(domainItems[url], null, null, ALL_ITEM_STATUSES); // stop watching
                    chrome.storage.local.set({[domain]: JSON.stringify(domainItems)}, () => {
                        if (currentURL === url) {
                            updateAutoSaveStatus(url);
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

        delete State.notifications[notifId];
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
        State.notifications[id] = {
            url,
            domain,
            type
        };
    });

    State.notificationsCounter++;
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

function sortItemsByTime({timestamp: tsA}, {timestamp: tsB}) {
    return tsA - tsB;
}

function matchesDomain(string) {
    return MATCHES.DOMAIN.test(string);
}

function matchesHostname(string) {
    return MATCHES.HOSTNAME.test(string);
}

function matchesURL(string) {
    return MATCHES.URL.test(string);
}

function setupTrackingPolling() {
    checkForPriceChanges();
    setInterval(checkForPriceChanges, CHECKING_INTERVAL);
}

function updateAutoSaveStatus(url) {
    const [, domain] = url.match(MATCHES.CAPTURE.DOMAIN_IN_URL);
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

function updateExtensionAppearance(currentDomain, currentUrl, forcePageTrackingTo) {
    if (forcePageTrackingTo === true) {
        setTrackedItemAppearance();
        enableCurrentPageTracked();
    } else if (forcePageTrackingTo === false) {
        setDefaultAppearance();
        disableCurrentPageTracked();
    } else if (!forcePageTrackingTo) {
        if (!currentDomain) {
            chrome.storage.local.get(null, result => {
                const storageState = filterAllTrackedItems(result);
                let wasFound = false;
                for (let domain in storageState) {
                    const domainState = storageState[domain];
                    const item = domainState[currentUrl];
                    if (item && isWatched(item)) {
                        setTrackedItemAppearance();
                        enableCurrentPageTracked();
                        wasFound = true;
                        break;
                    }
                }
                if (!wasFound) {
                    setDefaultAppearance();
                    disableCurrentPageTracked();
                }
            });
        } else {
            chrome.storage.local.get([currentDomain], domainResult => {
                const domainState = JSON.parse(domainResult);
                const item = domainState[currentUrl];
                if (item && isWatched(item)) {
                    setTrackedItemAppearance();
                    enableCurrentPageTracked()
                } else {
                    setDefaultAppearance();
                    disableCurrentPageTracked();
                }
            });
        }
    }
}

function captureHostAndPathFromURL(url) {
    const captureHostAndPath = url.match(MATCHES.CAPTURE.HOST_AND_PATH);
    let hostAndPath = null;
    if (captureHostAndPath) {
        [, hostAndPath] = captureHostAndPath;
    }
    return hostAndPath;
}

function getEqualPathItem(domainState, currentURL, callback) {
    const currentHostAndPath = captureHostAndPathFromURL(currentURL);
    let foundOne = false;
    for (let url in domainState) {
        if (matchesURL(url) && domainState.hasOwnProperty(url)) {
            const hostAndPath = captureHostAndPathFromURL(url);
            if (hostAndPath === currentHostAndPath) {
                foundOne = foundOne === false;
                callback(url);
                return;
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
                callback(true);
            } else {
                // it's the first time user is being inquired about items similarity in this domain
                getEqualPathItem(domain, currentURL, similarURL => {
                    if (similarURL) {
                        // found an URL whose host and path are equals to the currentURL trying to be saved
                        // prompt user to confirm if the item is the same

                        // const isSaved = askSaveConfirmation(currentURL, similarURL);
                        // TODO: Currently this is limited, it needs:
                        // TODO: Option to say "if URL differs then item is different, stop annoying me!"

                        chrome.tabs.sendMessage(tabId, {type: "SIMILAR_ITEM.START_CONFIRMATION_DISPLAY"}, ({status}) => {
                            if (status === 1) {
                                // TODO: send other message now to the modal.js
                                // finally is its response call the callback
                                    if (isSaved) {
                                        domainState._isPathEnoughToTrack = true;
                                        chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                    }
                                    callback(isSaved);
                            }
                        });
                    } else {
                        // no URL has host and path equals to the currentURL
                        callback(false);
                    }
                });
            }
        } else {
            // this means it's the first item being saved belonging to this domain
            callback(false);
        }
    });
}

// TODO: break this down into smaller functions
function attachEvents() {
    chrome.runtime.onInstalled.addListener(() => {
        console.log("Price tag installed.");
    });

    chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
        chrome.tabs.getSelected(windowId, ({url}) => {
            if (url.startsWith("http")) {
                updateCurrentURL(url);
                updateAutoSaveStatus(url);
                updateExtensionAppearance(null, url);
                State.faviconURL = State._faviconURLMap[tabId] || null;
            } else {
                setDefaultAppearance();
            }
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, {status, favIconUrl}, {active, url}) => {
        if (url.startsWith("http")) {
            if (active) {
                updateCurrentURL(url);

                if (status === "loading") {
                    updateAutoSaveStatus(url);
                    updateExtensionAppearance(null, url);
                }

                if (favIconUrl) {
                    State._faviconURLMap[tabId] = favIconUrl;
                    State.faviconURL = favIconUrl;
                }
            }
        } else {
            setDefaultAppearance();
        }
    });

    chrome.runtime.onMessage.addListener(
        ({type, payload = {}}, sender, sendResponse) => {
            const {id} = payload;
            switch (type) {
                case "POPUP.STATUS":
                    const {recordActive, autoSaveEnabled} = State;
                    sendResponse({status: 1, state: {recordActive, autoSaveEnabled}});
                    break;
                case "RECORD.ATTEMPT":
                    State.recordActive = !State.recordActive;

                    if (State.recordActive) {
                        const {url} = payload;
                        chrome.tabs.sendMessage(id, {type: "RECORD.START", payload: {url}}, onRecordDone);
                    } else {
                        chrome.tabs.sendMessage(id, {type: "RECORD.CANCEL"}, onRecordCancel);
                    }
                    sendResponse({status: 1, state: {recordActive: State.recordActive}});
                    break;
                case "AUTO_SAVE.STATUS":
                    const {url} = payload;
                    chrome.tabs.sendMessage(id, {
                        type: "AUTO_SAVE.CHECK_STATUS",
                        payload: {url, selection: State.selection}
                    }, onAutoSaveCheckStatus.bind(null, sendResponse));
                    return true;
                case "AUTO_SAVE.ATTEMPT":
                    if (State.autoSaveEnabled) {
                        const {domain, url: stateUrl, selection, price, faviconURL, faviconAlt, originalBackgroundColor} = State;

                        // checkForURLSimilarity(id, domain, url)
                        createItem(domain, stateUrl, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED], () => {
                            chrome.tabs.sendMessage(id, {
                                type: "AUTO_SAVE.HIGHLIGHT.STOP",
                                payload: {selection, originalBackgroundColor}
                            }, onSimilarElementHighlight);

                            updateExtensionAppearance(domain, stateUrl, true);

                            sendResponse(false);
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
                            type: "AUTO_SAVE.HIGHLIGHT.START",
                            payload: {selection}
                        }, onSimilarElementHighlight);
                    }
                    break;
                case "AUTO_SAVE.HIGHLIGHT.PRE_STOP":
                    if (State.autoSaveEnabled) {
                        const {selection, originalBackgroundColor} = State;
                        chrome.tabs.sendMessage(id, {
                            type: "AUTO_SAVE.HIGHLIGHT.STOP",
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
