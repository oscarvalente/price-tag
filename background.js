let State = {
    recordActive: false,
    notifications: {},
    notificationsCounter: 0,
    autoSaveEnabled: false,
    selection: null,
    isSimilarElementHighlighted: false,
    originalBackgroundColor: null
};

// const CHECKING_INTERVAL = 180000;
const CHECKING_INTERVAL = 10000;
const ICONS = {
    PRICE_UPDATE: "./assets/time-is-money.svg",
    PRICE_NOT_FOUND: "./assets/time.svg",
    PRICE_FIX: "./assets/coin.svg"
};

const ITEM_STATUS = {
    WATCHED: "WATCHED",
    NOT_FOUND: "NOT_FOUND",
    INCREASED: "INCREASED",
    DECREASED: "DECREASED",
    FIXED: "FIXED"
};

const ALL_ITEM_STATUSES = Object.values(ITEM_STATUS);

function removeStatuses(item, statusesToRemove = []) {
    return statusesToRemove.length > 0 && item.statuses.length > 0 ?
        item.statuses.filter(status => statusesToRemove.indexOf(status) === -1) :
        item.statuses;
}

function updateItem(item, price, statusesToAdd, statusesToRemove) {
    const statuses = [...removeStatuses(item, statusesToRemove), ...statusesToAdd];
    const updatedItem = {
        ...item,
        statuses
    };

    if (price) {
        updatedItem.price = price;
    }

    return updatedItem;
}

function onRecordDone(payload) {
    const {status, domain, url, selection, price} = payload;
    if (status > 0) {
        savePrice(domain, url, selection, price, [ITEM_STATUS.WATCHED]);
    }

    State.recordActive = false;
}

function onRecordCancel() {
    State.recordActive = false;
}

function onCheckStatus(sendResponse, {status, url, domain, selection, price}) {
    if (status >= 0) {
        State = setSelectionInfo(State, url, domain, selection, price);
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

// TODO: price becomes a class
function savePrice(domain, url, selection, price, statuses, callback) {
    chrome.storage.sync.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : {};
        items[url] = {selection, price: toPrice(price), timestamp: new Date().getTime(), statuses};

        chrome.storage.sync.set({[domain]: JSON.stringify(items)}, () => {
            State = disableAutoSave(State);
            if (callback) {
                callback();
            }
            // TODO: sendResponse("done"); // foi gravado ou não
        });
    });
}

function resetNotifications(state) {
    return {
        ...state,
        notifications: {},
        notificationsCounter: 0
    };
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

function setSelectionInfo(state, url, domain, selection, price) {
    return {
        ...state,
        url,
        domain,
        selection,
        price
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
    State = resetNotifications(State);
    chrome.storage.sync.get(null, items => {
            const domains = Object.keys(items);
            chrome.storage.sync.get(domains, trackedItems => {
                for (domain of domains) {
                    const domainItems = JSON.parse(trackedItems[domain]);

                    for (let url in domainItems) {
                        if (domainItems.hasOwnProperty(url)) {
                            const request = new XMLHttpRequest();
                            const oldPrice = domainItems[url].price;

                            request.onload = function () {
                                const template = createHTMLTemplate(this.response);
                                try {
                                    let newPrice = null;
                                    const innerText = template.querySelector(domainItems[url].selection).innerText;
                                    if (innerText) {
                                        const innerTextMatch = innerText.match(/((?:\d+[.,])?\d+(?:[.,]\d+)?)/);
                                        if (innerTextMatch) {
                                            [, newPrice] = innerTextMatch;

                                            newPrice = toPrice(newPrice);

                                            if (!oldPrice) {
                                                domainItems[url] = updateItem(domainItems[url], newPrice,
                                                    [ITEM_STATUS.FIXED], [ITEM_STATUS.NOT_FOUND]);
                                                chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                    const notificationId = `TRACK.PRICE_FIXED-${State.notificationsCounter}`;
                                                    createNotification(notificationId, ICONS.PRICE_FIX, "Fixed price",
                                                        `Ermm.. We've just fixed a wrongly set price to ${newPrice}`, url, url);
                                                });
                                            } else if (newPrice < oldPrice) {
                                                domainItems[url] = updateItem(domainItems[url], newPrice,
                                                    [ITEM_STATUS.DECREASED], [ITEM_STATUS.INCREASED, ITEM_STATUS.NOT_FOUND]);

                                                chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                    // TODO: sendResponse("done"); // foi actualizado ou não
                                                    const notificationId = `TRACK.PRICE_UPDATE-${State.notificationsCounter}`;
                                                    createNotification(notificationId, ICONS.PRICE_UPDATE, "Lower price!!",
                                                        `Lower price ${newPrice} (previous ${oldPrice})`, url, url);
                                                });
                                            } else if (newPrice > oldPrice) {
                                                domainItems[url] = updateItem(domainItems[url], null,
                                                    [ITEM_STATUS.INCREASED], [ITEM_STATUS.DECREASED, ITEM_STATUS.NOT_FOUND]);
                                                chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, () => {
                                                    // TODO: sendResponse("done"); // foi actualizado ou não
                                                });
                                            }
                                        }
                                    }

                                    if (domainItems[url].price && !newPrice) {
                                        domainItems[url] = updateItem(domainItems[url], null,
                                            [ITEM_STATUS.NOT_FOUND],
                                            [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED]);

                                        chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, () => {
                                            // TODO: sendResponse("done"); // foi actualizado ou não
                                            const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                                            const previousPrice = oldPrice ? ` (previous ${oldPrice})` : "";
                                            createNotification(notificationId, ICONS.PRICE_NOT_FOUND, "Price gone",
                                                `Price tag no longer found${previousPrice}`, url, url);
                                        });
                                    }
                                } catch (e) {
                                    console.warn(`Invalid price selection element in\n${url}:\t"${domainItems[url].selection}"`);
                                    domainItems[url] = updateItem(domainItems[url], null,
                                        [ITEM_STATUS.NOT_FOUND], [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED]);

                                    chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, () => {
                                        const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                                        const previousPrice = oldPrice ? ` (previous ${oldPrice})` : "";
                                        createNotification(notificationId, ICONS.PRICE_NOT_FOUND, "Price gone",
                                            `Price tag no longer found${previousPrice}`, url, url);
                                    });
                                }
                            };

                            request.open("GET", url);
                            request.send();
                        }
                    }
                }
            });
        }
    )
    ;
}

function getTrackedItems(callback) {
    chrome.storage.sync.get(null, result => {
        let trackedItems = [];
        Object.keys(result).forEach(key => {
            if (matchesDomain(key)) {
                const domainData = result[key];
                const domainItems = JSON.parse(domainData) || null;
                if (domainItems) {
                    const sortedDomainItems = [];
                    Object.keys(domainItems).forEach(itemKey => {
                        if (matchesHostname(itemKey)) {
                            const item = {
                                ...domainItems[itemKey],
                                url: itemKey
                            };
                            sortedDomainItems.push(item);
                        }
                    });
                    sortedDomainItems.sort(sortItemsByTime);
                    trackedItems = [...trackedItems, ...sortedDomainItems];
                }
            }
        });
        callback(trackedItems);
    });
}

function removeTrackedItem(url, callback) {
    let found = false;
    chrome.storage.sync.get(null, result => {
        Object.keys(result).forEach(domain => {
            if (matchesDomain(domain)) {
                const domainData = result[domain];
                const domainItems = JSON.parse(domainData) || null;
                if (domainItems[url]) {
                    found = true;
                    // TODO: change status
                    delete domainItems[url];
                    chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, (v) => {
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

function clearNotification(notifId) {
    chrome.notifications.clear(notifId, wasCleared => {
        if (wasCleared) {
            delete State.notifications[notifId];
        }
    });
}

function createNotification(notifId, iconUrl, title, message, contextMessage = "", url) {
    const options = {
        type: "basic",
        title,
        message,
        iconUrl,
        contextMessage
    };

    chrome.notifications.create(notifId, options, id => {
        State.notifications[id] = url;
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
    return tsA > tsB ? 1 : 0;
}

function matchesDomain(string) {
    return /^([\w-_]+\.?)+\w$/.test(string);
}

function matchesHostname(string) {
    return /https?:\/\/([\w.]+)\/*/.test(string);
}

function setupTrackingPolling() {
    checkForPriceChanges();
    setInterval(checkForPriceChanges, CHECKING_INTERVAL);
}

function updateAutoSaveStatus(url) {
    const [, domain] = url.match(/https?:\/\/([\w.]+)\/*/);
    chrome.storage.sync.get([domain], result => {
        const items = result && result[domain] ? JSON.parse(result[domain]) : null;
        if (items && !items[url]) {
            const urlFromDomain = Object.keys(items)[0];
            if (items[urlFromDomain] && items[urlFromDomain].selection) {
                State = enableAutoSave(State, items[urlFromDomain].selection);
            }
        } else {
            State = disableAutoSave(State);
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
                updateAutoSaveStatus(url);
            }
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, {status}, {active, url}) => {
        if (url.startsWith("http")) {
            if (active && status === "complete") {
                chrome.tabs.executeScript(tabId, {
                    file: "page-agent.js"
                });
            }

            updateAutoSaveStatus(url);
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
                    }, onCheckStatus.bind(null, sendResponse));
                    return true;
                case "AUTO_SAVE.ATTEMPT":
                    if (State.autoSaveEnabled) {
                        const {domain, url: stateUrl, selection, price, originalBackgroundColor} = State;
                        savePrice(domain, stateUrl, selection, price, [ITEM_STATUS.WATCHED], () => {
                            chrome.tabs.sendMessage(id, {
                                type: "AUTO_SAVE.HIGHLIGHT.STOP",
                                payload: {selection, originalBackgroundColor}
                            }, onSimilarElementHighlight);

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
                    removeTrackedItem(itemUrl, sendResponse);
                    return true;
            }
        });

    chrome.notifications.onClicked.addListener(notifId => {
        chrome.tabs.create({url: State.notifications[notifId]});
        clearNotification(notifId);
    });

    chrome.notifications.onClosed.addListener(clearNotification);
}

function bootstrap() {
    setupTrackingPolling();
    attachEvents();
}

bootstrap();
