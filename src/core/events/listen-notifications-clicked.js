import {switchMap, tap} from "rxjs/operators";
import StateManager from "../state-manager";
import onNotificationsClicked from "./internal/notifications-clicked";
import createTab from "./internal/tabs-create";
import onClearedNotification from "./on-cleared-notification";

function listenNotificationsClicked() {
    return onNotificationsClicked().pipe(
        switchMap(notificationId => StateManager.getNotifications$()
            .pipe(
                tap(notifications => {
                    createTab(notifications[notificationId].url);
                }),
                // on cleared notification function needs explicitly to receive JUST ONE PARAMETER
                switchMap(() => onClearedNotification(notificationId))
            )
        )
    );
}

export default listenNotificationsClicked;
