import {fromEventPattern} from 'rxjs';
import {take} from 'rxjs/operators';

function clearNotification(notificationId) {
    return fromEventPattern(handler => {
        chrome.notifications.clear(notificationId, handler);
    }).pipe(
        take(1)
    );
}

export default clearNotification;
