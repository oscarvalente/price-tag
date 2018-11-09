import {fromEventPattern} from "rxjs";
import {map, switchMap} from "rxjs/operators";
import {transformCallbackToObservable} from "../../../utils/rx";

function addOnMessage(handler) {
    chrome.runtime.onMessage.addListener((payload, sender, sendResponse) => {
        handler(payload, sender, sendResponse);
        return true;
    });
}

function onMessage(handler$) {
    return fromEventPattern(addOnMessage)
        .pipe(
            map(([payload, sender, sendResponse]) =>
                ({payload, sender, sendResponse$: transformCallbackToObservable(sendResponse)})),
            switchMap(handler$)
        );
}

export default onMessage;
