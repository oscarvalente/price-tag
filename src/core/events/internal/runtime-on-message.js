import {fromEventPattern} from "rxjs";
import {map} from "rxjs/operators";
import {transformCallbackToObservable} from "../../../utils/rx";

function addOnMessage(handler) {
    chrome.runtime.onMessage.addListener(handler);
}

function onMessage() {
    return fromEventPattern(addOnMessage)
        .pipe(
            map(([payload, sender, sendResponse]) =>
                ({payload, sender, sendResponse$: transformCallbackToObservable(sendResponse)}))
        );
}

export default onMessage;
