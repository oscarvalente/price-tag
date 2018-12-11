import {of} from "rxjs";
import {switchMap, filter} from "rxjs/operators";
import {TIME as SORT_ITEMS_BY_TIME} from "./src/config/sort-tracked-items";
import {
    PRICE_CHECKING_INTERVAL,
    SYNCHING_INTERVAL,
} from "./src/config/background";
import {
    setDefaultAppearance
} from "./src/core/events/appearance";
import {
    syncStorageState
} from "./src/core/events/storage";
import StateManager from "./src/core/state-manager";
import onInstalled$ from "./src/core/events/internal/installed";
import onUpdated$ from "./src/core/events/internal/updated";
import onActivatedTab$ from "./src/core/events/activated-tab";
import onCompletedTab$ from "./src/core/events/listen-completed-tab";
import listenNotificationsButtonClicked$ from "./src/core/events/listen-notifications-buttons-clicked";
import listenNotificationsClosed$ from "./src/core/events/listen-notifications-closed";
import listenNotificationsClicked$ from "./src/core/events/listen-notifications-clicked";
import onTabContextChange$ from "./src/core/events/on-tab-context-change";
import {
    listenPopupStatus as listenPopupStatus$,
    listenRecordAttempt as listenRecordAttempt$,
    listenAutoSaveStatus as listenAutoSaveStatus$,
    listenAutoSaveHighlightPreStart as listenAutoSaveHighlightPreStart$,
    listenAutoSaveHighlightPreStop as listenAutoSaveHighlightPreStop$,
    listenAutoSaveAttempt as listenAutoSaveAttempt$,
    listenPriceUpdateStatus as listenPriceUpdateStatus$,
    listenPriceUpdateAttempt as listenPriceUpdateAttempt$,
    listenPriceUpdateHighlightPreStart as listenPriceUpdateHighlightPreStart$,
    listenPriceUpdateHighlightPreStop as listenPriceUpdateHighlightPreStop$,
    listenTrackedItemsOpen as listenTrackedItemsOpen$,
    listenTrackedItemsGet as listenTrackedItemsGet$,
    listenTrackedItemsUnfollow as listenTrackedItemsUnfollow$,
    listenTrackedItemsChangeSort as listenTrackedItemsChangeSort$,
    listenTrackedItemsUndoAttempt as listenTrackedItemsUndoAttempt$
} from "./src/core/events/listen-runtime-messages";
import updateStatusAndAppearance$ from "./src/core/events/update-status-and-appearance";
import onStatusAndAppearanceUpdate from "./src/core/events/helpers/on-status-and-appearance-update";
import checkPriceChanges$ from "./src/core/events/check-price-changes";


StateManager.initState(SORT_ITEMS_BY_TIME);

function setupTrackingPolling() {
    checkPriceChanges$(PRICE_CHECKING_INTERVAL).subscribe();
}

// TODO: break this down into smaller functions
function attachEvents() {
    onInstalled$().subscribe(() => console.log("Price tag installed."));

    onActivatedTab$().pipe(
        switchMap(({id, url}) => {
            if (url.startsWith("http")) {
                const {_faviconURLMap} = StateManager.getState();
                StateManager.updateFaviconURL(_faviconURLMap[id]);
                return onTabContextChange$(id, url);
            } else {
                return of(undefined);
            }
        })
    ).subscribe(onStatusAndAppearanceUpdate);

    onUpdated$().subscribe(({tabId, favIconUrl, active, url}) => {
        if (url.startsWith("http")) {
            if (active && favIconUrl) {
                StateManager.updateFaviconURLMapItem(tabId, favIconUrl);
                StateManager.updateFaviconURL(favIconUrl);
            }
        } else {
            setDefaultAppearance();
        }
    });

    onCompletedTab$().pipe(
        switchMap(({id, url}) => onTabContextChange$(id, url))
    ).subscribe(onStatusAndAppearanceUpdate);

    listenPopupStatus$().subscribe();
    listenRecordAttempt$().subscribe();
    listenAutoSaveStatus$().subscribe();
    listenAutoSaveHighlightPreStart$().subscribe();
    listenAutoSaveHighlightPreStop$().subscribe();
    listenAutoSaveAttempt$().subscribe();
    listenPriceUpdateStatus$().subscribe();
    listenPriceUpdateAttempt$().subscribe();
    listenPriceUpdateHighlightPreStart$().subscribe();
    listenPriceUpdateHighlightPreStop$().subscribe();
    listenTrackedItemsOpen$(SORT_ITEMS_BY_TIME).subscribe();
    listenTrackedItemsGet$().subscribe();
    listenTrackedItemsUnfollow$().subscribe();
    listenTrackedItemsChangeSort$().subscribe();
    listenTrackedItemsUndoAttempt$().subscribe();

    listenNotificationsClicked$().subscribe();

    listenNotificationsButtonClicked$().pipe(
        filter(hasStoppedWatch => hasStoppedWatch),
        switchMap(() => {
            // in case user clicked "Stop watch"
            const {domain, currentURL, browserURL} = StateManager.getState();
            return updateStatusAndAppearance$(currentURL, domain, false, browserURL);
        }),
    ).subscribe(onStatusAndAppearanceUpdate);

    listenNotificationsClosed$().subscribe();
}

function setupSyncStorageState() {
    syncStorageState();
    setInterval(syncStorageState, SYNCHING_INTERVAL);
}

function bootstrap() {
    setupSyncStorageState();
    setupTrackingPolling();
    attachEvents();
}

bootstrap();
