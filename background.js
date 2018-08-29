chrome.runtime.onInstalled.addListener(() => {
    console.log("Price tag installed.");
});


chrome.tabs.onUpdated.addListener((tabId, {status}, {active}) => {
    if (active && status === "complete") {
        chrome.tabs.executeScript(tabId,
            {
                file: 'detect-selection.js'
            });
    }
});

chrome.runtime.onMessage.addListener(
    ({type, payload}, sender, sendResponse) => {
        const {id, url} = payload;
        switch (type) {
            case "RECORD.PRE_START":
                chrome.tabs.sendMessage(id, {type: "RECORD.START", payload: {url}}, onRecordStart);
                break;
            case "RECORD.PRE_CANCEL":
                chrome.tabs.sendMessage(id, {type: "RECORD.CANCEL"});
                break;
        }
    });

function onRecordStart(payload) {
    const {status, domain, url, selection, price} = payload;
    if (status > 0) {
        chrome.storage.sync.get([domain], result => {
            const items = result && result[domain] ? JSON.parse(result[domain]) : {};
            items[url] = {selection, price};

            chrome.storage.sync.set({[domain]: JSON.stringify(items)}, () => {
                // TODO: sendResponse("done"); // foi gravado ou não
            });
        });
    }
}
