const State = {
    recordActive: false
};

chrome.runtime.onInstalled.addListener(() => {
    console.log("Price tag installed.");
});

chrome.tabs.onUpdated.addListener((tabId, {status}, {active}) => {
    if (active && status === "complete") {
        chrome.tabs.executeScript(tabId,
            {
                file: "detect-selection.js"
            });
    }
});

chrome.runtime.onMessage.addListener(
    ({type, payload}, sender, sendResponse) => {
        switch (type) {
            case "RECORD.STATUS":

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

function onRecordDone(payload) {
    const {status, domain, url, selection, price} = payload;
    if (status > 0) {
        chrome.storage.sync.get([domain], result => {
            const items = result && result[domain] ? JSON.parse(result[domain]) : {};
            items[url] = {selection, price, timestamp: new Date().getTime()};

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
