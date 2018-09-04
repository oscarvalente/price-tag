let State = {
    recordActive: false,
    notifications: {},
    notificationsCounter: 0,
    autoSaveEnabled: false
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
                // TODO: sendResponse("done"); // foi gravado ou não
            });
        });
    }

    State.recordActive = false;
}

function onRecordCancel() {
    State.recordActive = false;
}

function resetNotifications(state) {
    return {
        ...state,
        notifications: {},
        notificationsCounter: 0
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

                    request.onload = function (e) {
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
            console.log('cleared', notifId);
            delete State.notifications[notifId];
        } else {
            console.log('not cleared', notifId);
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

function attachEvents() {
    chrome.runtime.onInstalled.addListener(() => {
        console.log("Price tag installed.");
    });

    chrome.tabs.onUpdated.addListener((tabId, {status}, {active, url}) => {
        if (url.startsWith("http") && active && status === "complete") {
            chrome.tabs.executeScript(tabId,
                {
                    file: "detect-selection.js"
                });

            // chrome.storage.sync.get([])
        }
    });

    chrome.runtime.onMessage.addListener(
        ({type, payload}, sender, sendResponse) => {
            switch (type) {
                case "POPUP.STATUS":
                    sendResponse({status: 1, state: {recordActive: State.recordActive}});
                    break;
                case "RECORD.ATTEMPT":
                    const {id, url} = payload;
                    State.recordActive = !State.recordActive;

                    if (State.recordActive) {
                        chrome.tabs.sendMessage(id, {type: "RECORD.START", payload: {url}}, onRecordDone);
                    } else {
                        chrome.tabs.sendMessage(id, {type: "RECORD.CANCEL"}, onRecordCancel);
                    }
                    sendResponse({status: 1, state: {recordActive: State.recordActive}});
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
