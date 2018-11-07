import {fromEventPattern} from "rxjs";

function addActivatedHandler(handler) {
    chrome.tabs.onActivated.addListener(handler);
}

function onActivated() {
    return fromEventPattern(addActivatedHandler);
}

export default onActivated;
