import {fromEventPattern} from "rxjs";
import {map, switchMap, filter} from "rxjs/operators";
import {transformCallbackToObservable} from "../../../utils/rx";

function addOnMessage(handler) {
    const handlerWrapper = (request, sender, sendResponse) => {
        handler(request, sender, sendResponse);
        return true;
    };
    chrome.runtime.onMessage.addListener(handlerWrapper);
    return handlerWrapper;
}

function onMessage(matchingMessageType, handler$) {
    return fromEventPattern(addOnMessage)
        .pipe(
            filter(([{type}]) => type === matchingMessageType),
            map(([payload, sender, sendResponse]) =>
                ({payload, sender, sendResponse$: transformCallbackToObservable(sendResponse)})),
            switchMap(handler$)
        );
}

export default onMessage;
