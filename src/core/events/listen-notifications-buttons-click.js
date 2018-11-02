import {switchMap, map, filter} from "rxjs/operators";
import get from "lodash/get";
import isFunction from "lodash/isFunction";

import onNotificationsButtonClicked from "./internal/notifications-button-clicked";
import ITEM_STATUS from "../../config/item-statuses";
import getStorageDomain from "./internal/get-storage-domain";
import ItemFactory from "../factories/item";
import StateManager from "../state-manager";
import setStorageDomain from "./internal/set-storage-domain";

const onUpdateItemMapping = [
    {
        [ITEM_STATUS.DECREASED]: onTrackWithDecreasedPriceClick,
        [ITEM_STATUS.INCREASED]: onTrackWithIncreasedPriceClick
    },
    {
        [ITEM_STATUS.DECREASED]: onStopTrackClick,
        [ITEM_STATUS.INCREASED]: onStopTrackClick
    }
];

function onTrackWithDecreasedPriceClick(item) {
    item.updateTrackStatus(item.price, null, [ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE], true);
    return item;
}

function onTrackWithIncreasedPriceClick(item) {
    item.updateTrackStatus(item.previousPrice, null, [ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE], true);
    return item;
}

function onStopTrackClick(item) {
    item.updateTrackStatus(null, null, ITEM_STATUS.ALL_STATUSES); // stop watching
    return item;
}

function getNotification$(getState$, notificationId) {
    return getState$().pipe(
        map(state => state.notifications[notificationId])
    );
}

function listenNotificationsButtonClicked() {
    return onNotificationsButtonClicked().pipe(
        // get notification object
        switchMap(({notificationId, buttonIndex}) =>
            getNotification$(StateManager.getState$, notificationId)
                .pipe(
                    map(notification => ({
                            notification,
                            buttonIndex
                        })
                    )
                )
        ),
        // get domain state for the item if exists
        switchMap(({notification, buttonIndex}) => {
            const {domain, url, type} = notification;
            return getStorageDomain(domain, url).pipe(
                filter(domainState => domainState[url]),
                map(domainState => ({
                        domainState,
                        domain,
                        url,
                        type,
                        buttonIndex
                    })
                )
            );
        }),
        // update item in its storage domain state according to click type
        map(({domainState, domain, url, type, buttonIndex}) => {
            const item = ItemFactory.createItemFromObject(domainState[url]);
            const updateItemFn = get(onUpdateItemMapping, [buttonIndex, type]);
            if (isFunction(updateItemFn)) {
                domainState[url] = updateItemFn(item);
                return setStorageDomain(domain, domainState);
            }
        })
    );
}

export default listenNotificationsButtonClicked;
