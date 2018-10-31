import {fromEventPattern} from 'rxjs';

function addQueryActiveTabHandler(handler) {
    chrome.tabs.query({active: true, currentWindow: true}, handler);
}

function queryActiveTab() {
    return fromEventPattern(addQueryActiveTabHandler);
}

export default queryActiveTab;
