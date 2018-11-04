import {of} from "rxjs";
import {switchMap, map, tap, filter} from "rxjs/operators";
import get from "lodash/get";
import isFunction from "lodash/isFunction";
import isEmpty from "lodash/isEmpty";
import clearNotification from "./internal/notifications-clear";
import StateManager from "../state-manager";
import getStorageDomain from "./internal/get-storage-domain";
import ItemFactory from "../factories/item";
import setStorageDomain from "./internal/set-storage-domain";
import ITEM_STATUS from "../../config/item-statuses";

const onUpdateItemMapping = {
    [ITEM_STATUS.DECREASED]: onAckPriceDecrease,
    [ITEM_STATUS.INCREASED]: onAckPriceIncrease
};

function onAckPriceDecrease(item) {
    item.updateTrackStatus(null, [ITEM_STATUS.ACK_DECREASE]);
    return item;
}

function onAckPriceIncrease(item) {
    item.updateTrackStatus(null, [ITEM_STATUS.ACK_INCREASE]);
    return item;
}

function onClearedNotification(notificationId, wasClosedByUser) {
    return clearNotification(notificationId).pipe(
        map(wasClickedByUser => ({notificationId, wasClosedByUser, wasClickedByUser})),
        switchMap(({notificationId, wasClosedByUser, wasClickedByUser}) => (
            wasClickedByUser || wasClosedByUser ?
                StateManager.getNotification$(notificationId) :
                of()
        )),
        tap(() => {
            StateManager.deleteNotificationsItem(notificationId);
        }),
        filter(notifcation => !isEmpty(notifcation)),
        switchMap(notification => {
            const {domain} = notification;
            return getStorageDomain(domain).pipe(
                map(domainState => {
                    const {url, type} = notification;
                    const item = ItemFactory.createItemFromObject(domainState[url]);
                    const updateItemFn = get(onUpdateItemMapping, [type]);
                    if (isFunction(updateItemFn)) {
                        domainState[url] = updateItemFn(item);
                        return setStorageDomain(domain, domainState);
                    } else {
                        return of();
                    }
                })
            );
        })
    )
}

export default onClearedNotification;
