import {merge} from "rxjs";
import {switchMap} from "rxjs/operators";
import StateManager from "../state-manager";
import onNotificationsClicked from "./internal/notifications-clicked";
import createTab from "./internal/tabs-create";
import onClearedNotification from "./on-cleared-notification";

function listenNotificationsClicked() {
    return onNotificationsClicked().pipe(
        switchMap(notificationId => StateManager.getNotifications$()
            .pipe(
                // on cleared notification function needs explicitly to receive JUST ONE PARAMETER
                switchMap(notifications =>
                    // merge so that both streams are subscribed (to create tab and clear notification)
                    merge(
                        createTab(notifications[notificationId].url),
                        onClearedNotification(notificationId)
                    )
                )
            )
        )
    );
}

export default listenNotificationsClicked;
