import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function sendRuntimeMessage(payload) {
    return fromEventPattern(sendResponse$ => {
        // needs to return the sendResponse$ observable
        chrome.runtime.sendMessage(payload, response => sendResponse$(response));
    }).pipe(
        take(1)
    );
}

export default sendRuntimeMessage;
