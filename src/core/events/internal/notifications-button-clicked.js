import {fromEventPattern} from 'rxjs';
import {map} from 'rxjs/operators';

function addNotificationsButtonClickedHandler(handler) {
    chrome.notifications.onButtonClicked.addListener(handler);
}

function onNotificationsButtonClicked() {
    return fromEventPattern(addNotificationsButtonClickedHandler)
        .pipe(
            map(([notificationId, buttonIndex]) => ({notificationId, buttonIndex})),
        );
}

export default onNotificationsButtonClicked;
