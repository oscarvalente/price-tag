import {fromEventPattern} from 'rxjs';
import {take} from "rxjs/operators";

function addQueryActiveTabHandler(handler) {
    chrome.tabs.query({active: true, currentWindow: true}, handler);
}

function queryActiveTab() {
    return fromEventPattern(addQueryActiveTabHandler)
        .pipe(take(1));
}

export default queryActiveTab;
