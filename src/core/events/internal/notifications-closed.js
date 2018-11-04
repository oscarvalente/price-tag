import {fromEventPattern} from 'rxjs';
import {map} from 'rxjs/operators';

function addNotificationsClosed(handler) {
    chrome.notifications.onClosed.addListener(handler);
}

function onNotificationsClosed() {
    return fromEventPattern(addNotificationsClosed).pipe(
        map(([notificationId, wasClosedByUser]) => ({notificationId, wasClosedByUser}))
    );
}

export default onNotificationsClosed;
