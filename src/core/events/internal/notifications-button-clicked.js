import {fromEventPattern} from 'rxjs';
import {map, tap} from 'rxjs/operators';

function addNotificationsButtonClickedHandler(handler) {
    chrome.notifications.onButtonClicked.addListener(handler);
}

function onNotificationsButtonClicked() {
    return fromEventPattern(addNotificationsButtonClickedHandler)
        .pipe(
            tap(x => console.log('button clicked', x)),
            map(([notificationId, buttonIndex]) => ({notificationId, buttonIndex})),
            tap(x => console.log('button clicked', x))
        );
}

export default onNotificationsButtonClicked;
