import {fromEventPattern} from 'rxjs';

function addHistoryStateUpdatedHandler(handler) {
    chrome.webNavigation.onHistoryStateUpdated.addListener(handler);
}

function onHistoryStateUpdated() {
    return fromEventPattern(addHistoryStateUpdatedHandler);
}

export default onHistoryStateUpdated;
