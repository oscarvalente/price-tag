import {fromEventPattern} from 'rxjs';

function addNotificationsClickedHandler(handler) {
    chrome.notifications.onClicked.addListener(handler);
}

function onNotificationsClicked() {
    return fromEventPattern(addNotificationsClickedHandler);
}

export default onNotificationsClicked;
