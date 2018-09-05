let State = {
    recordActive: false,
    notifications: {},
    notificationsCounter: 0,
    autoSaveEnabled: false,
    selection: null
};

// const CHECKING_INTERVAL = 180000;
const CHECKING_INTERVAL = 10000;
const ICONS = {
    PRICE_UPDATE: "./assets/time-is-money.svg",
    PRICE_NOT_FOUND: "./assets/time.svg",
    PRICE_FIX: "./assets/coin.svg"
};

function onRecordDone(payload) {
    const {status, domain, url, selection, price} = payload;
    if (status > 0) {
        chrome.storage.sync.get([domain], result => {
            const items = result && result[domain] ? JSON.parse(result[domain]) : {};
            items[url] = {selection, price: toPrice(price), timestamp: new Date().getTime()};

            chrome.storage.sync.set({[domain]: JSON.stringify(items)}, () => {
                State = disableAutoSave(State);
                // TODO: sendResponse("done"); // foi gravado ou não
            });
        });
    }

    State.recordActive = false;
}

function onRecordCancel() {
    State.recordActive = false;
}

function onCheckStatus(sendResponse, {status}) {
    if (status >= 0) {
        sendResponse(true);
    } else {
        sendResponse(false);
    }
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

function checkForPriceChanges() {
    State = resetNotifications(State);
    chrome.storage.sync.get(null, items => {
        const domains = Object.keys(items);
        chrome.storage.sync.get(domains, trackedItems => {
            for (domain of domains) {
                const domainItems = JSON.parse(trackedItems[domain]);

                for (let url in domainItems) {
                    const request = new XMLHttpRequest();
                    // TODO: const oldPrice
                    let oldPrice = domainItems[url].price;

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
                                        chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, () => {
                                            const notificationId = `TRACK.PRICE_FIXED-${State.notificationsCounter}`;
                                            createNotification(notificationId, ICONS.PRICE_FIX, "Fixed price",
                                                `Ermm.. We've just fixed a wrongly set price to ${newPrice}`, url, url);
                                        });
                                    } else if (newPrice < oldPrice) {
                                        domainItems[url].price = newPrice;
                                        chrome.storage.sync.set({[domain]: JSON.stringify(domainItems)}, () => {
                                            // TODO: sendResponse("done"); // foi actualizado ou não
                                            const notificationId = `TRACK.PRICE_UPDATE-${State.notificationsCounter}`;
                                            createNotification(notificationId, ICONS.PRICE_UPDATE, "Lower price!!",
                                                `Lower price ${newPrice} (previous ${oldPrice})`, url, url);
                                        });
                                    }
                                }
                            }

                            if (domainItems[url].price && !newPrice) {
                                const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                                const previousPrice = oldPrice ? ` (previous ${oldPrice})` : "";
                                createNotification(notificationId, ICONS.PRICE_NOT_FOUND, "Price gone",
                                    `Price tag no longer found${previousPrice}`, url, url);
                            }
                        } catch (e) {
                            console.warn(`Invalid price selection element in\n${url}:\t"${domainItems[url].selection}"`);
                            const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                            const previousPrice = oldPrice ? ` (previous ${oldPrice})` : "";
                            createNotification(notificationId, ICONS.PRICE_NOT_FOUND, "Price gone",
                                `Price tag no longer found${previousPrice}`, url, url);
                        }
                    };

                    request.open("GET", url);
                    request.send();
                }
            }
        });
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

function setupTrackingPolling() {
    checkForPriceChanges();
    setInterval(checkForPriceChanges, CHECKING_INTERVAL);
}

// TODO: break this down into smaller functions
function attachEvents() {
    chrome.runtime.onInstalled.addListener(() => {
        console.log("Price tag installed.");
    });

    chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
        chrome.tabs.getSelected(windowId, ({url}) => {
            if (url.startsWith("http")) {
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
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, {status}, {active, url}) => {
        if (url.startsWith("http") && active && status === "complete") {
            chrome.tabs.executeScript(tabId, {
                file: "page-agent.js"
            });
        }
    });

    chrome.runtime.onMessage.addListener(
        ({type, payload = {}}, sender, sendResponse) => {
            const {id, url} = payload;
            switch (type) {
                case "POPUP.STATUS":
                    const {recordActive, autoSaveEnabled} = State;
                    sendResponse({status: 1, state: {recordActive, autoSaveEnabled}});
                    break;
                case "RECORD.ATTEMPT":
                    State.recordActive = !State.recordActive;

                    if (State.recordActive) {
                        chrome.tabs.sendMessage(id, {type: "RECORD.START", payload: {url}}, onRecordDone);
                    } else {
                        chrome.tabs.sendMessage(id, {type: "RECORD.CANCEL"}, onRecordCancel);
                    }
                    sendResponse({status: 1, state: {recordActive: State.recordActive}});
                    break;
                case "AUTO_SAVE.STATUS":
                    chrome.tabs.sendMessage(id, {
                        type: "AUTO_SAVE.CHECK_STATUS",
                        payload: {url, selection: State.selection}
                    }, onCheckStatus.bind(null, sendResponse));
                    return true;
                case "AUTO_SAVE.ATTEMPT":
                    if (State.autoSaveEnabled) {

                    }
                    break;
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
