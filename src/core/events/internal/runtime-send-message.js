import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function sendRuntimeMessage(payload) {
    return fromEventPattern(sendResponse => {
        chrome.runtime.sendMessage(payload, sendResponse);
    }).pipe(
        take(1)
    );
}

export default sendRuntimeMessage;
