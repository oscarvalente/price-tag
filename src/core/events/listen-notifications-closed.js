import {switchMap} from "rxjs/operators";
import onNotificationsClosed from "./internal/notifications-closed";
import onClearedNotification from "./on-cleared-notification";

function listenNotificationsClosed() {
    return onNotificationsClosed().pipe(
        switchMap(({notificationId, wasClosedByUser}) => onClearedNotification(notificationId, wasClosedByUser))
    );
}

export default listenNotificationsClosed;
