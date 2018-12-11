import {tap} from "rxjs/operators";
import StateManager from "../state-manager";
import createNotification from "./internal/notifications-create";

function createCustomNotification(notificationId, iconUrl, title, message, contextMessage = "", url, domain, type, extraOptions = {}) {
    const options = {
        type: "basic",
        title,
        message,
        iconUrl,
        contextMessage,
        requireInteraction: true,
        ...extraOptions
    };

    return createNotification(notificationId, options)
        .pipe(
            tap(id => {
                StateManager.incrementNotificationsCounter();
                StateManager.updateNotificationsItem(id, {url, domain, type});
            })
        );
}

export default createCustomNotification;
