import {fromEventPattern} from 'rxjs';
import {take} from "rxjs/operators";

function createNotification(notificationId, options) {
    return fromEventPattern(handler => {
        chrome.notifications.create(notificationId, options, handler);
    }).pipe(
        take(1)
    );
}

export default createNotification;
