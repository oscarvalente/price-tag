import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function sendTabMessage(tabId, payload) {
    return fromEventPattern(sendResponse => {
        chrome.tabs.sendMessage(tabId, payload, sendResponse);
    }).pipe(
        take(1)
    );
}

export default sendTabMessage;
