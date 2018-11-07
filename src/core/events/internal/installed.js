import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function addInstalledHandler(handler) {
    chrome.runtime.onInstalled.addListener(handler);
}

function onInstalled() {
    return fromEventPattern(addInstalledHandler).pipe(take(1));
}

export default onInstalled;
