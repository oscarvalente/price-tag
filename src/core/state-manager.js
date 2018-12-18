import {of} from "rxjs";
import {map, take} from "rxjs/operators";
import mapValues from "lodash/mapValues";

import StateFactory from "./factories/state";

let State = null;

class StateManager {
    static getState() {
        return State;
    }

    static getState$() {
        return of(State);
    }

    static initState(sortItemsByType) {
        State = StateFactory.createState(sortItemsByType);
        return State;
    }

    static toggleRecord() {
        State = StateFactory.toggleRecord(State);
        return State;
    }

    static disableRecord() {
        State = StateFactory.disableRecord(State);
        return State;
    }

    static updateCurrentDomain(domain) {
        State = StateFactory.updateCurrentDomain(State, domain);
        return State;
    }

    static updateCurrentURL(currentURL) {
        State = StateFactory.updateCurrentURL(State, currentURL);
        return State;
    }

    static updateCanonicalURL(canonicalURL) {
        State = StateFactory.updateCanonicalURL(State, canonicalURL);
        return State;
    }

    static updateBrowserURL(browserURL) {
        State = StateFactory.updateBrowserURL(State, browserURL);
        return State;
    }

    static enableCurrentPageTracked() {
        State = StateFactory.enableCurrentPageTracked(State);
        return State;
    }

    static disableCurrentPageTracked() {
        State = StateFactory.disableCurrentPageTracked(State);
        return State;
    }

    static updateFaviconURL(faviconURL) {
        State = StateFactory.updateFaviconURL(State, faviconURL || null);
        return State;
    }

    static updateFaviconURLMapItem(tabId, faviconURL) {
        State = StateFactory.updateFaviconURLMapItem(State, tabId, faviconURL);
        return State;
    }

    static enableAutoSave(selection) {
        selection = selection || State.selection;
        State = StateFactory.enableAutoSave(State, selection);
        return State;
    }

    static disableAutoSave() {
        State = StateFactory.disableAutoSave(State);
        return State;
    }

    static enablePriceUpdate(selection) {
        State = StateFactory.enablePriceUpdate(State, selection);
        return State;
    }

    static disablePriceUpdate() {
        State = StateFactory.disablePriceUpdate(State);
        return State;
    }

    static setSelectionInfo(selection, price, faviconURL, faviconAlt) {
        State = StateFactory.setSelectionInfo(State, selection, price, faviconURL, faviconAlt);
        return State;
    }

    static setSimilarElementHighlight(isSimilarElementHighlighted, originalBackgroundColor) {
        State = StateFactory.setSimilarElementHighlight(State, isSimilarElementHighlighted, originalBackgroundColor);
        return State;
    }

    static incrementNotificationsCounter() {
        State = StateFactory.incrementNotificationsCounter(State);
        return State;
    }

    static deleteNotificationsItem(notificationId) {
        State = StateFactory.deleteNotificationsItem(State, notificationId);
        return State;
    }

    static updateNotificationsItem(notificationId, notificationState) {
        State = StateFactory.updateNotificationsItem(State, notificationId, notificationState);
        return State;
    }

    static updateSortItemsBy(_sortItemsBy) {
        State = StateFactory.updateSortItemsBy(State, _sortItemsBy);
        return State;
    }

    static addUndoRemovedItem(url, item, maxItems) {
        State = StateFactory.addUndoRemovedItem(State, url, item, maxItems);
        return State;
    }

    static getUndoRemovedItemsHead() {
        return StateFactory.getUndoRemovedItemsHead(State);
    }

    static removeUndoRemovedItem() {
        State = StateFactory.removeUndoRemovedItem(State);
        return State;
    }

    static removeUndoRemovedItemByURL(url) {
        State = StateFactory.removeUndoRemovedItemByURL(State, url);
        return State;
    }

    static resetUndoRemovedItems() {
        State = StateFactory.resetUndoRemovedItems(State);
        return State;
    }

    static setUndoRemovedItemsResetTask(task) {
        State = StateFactory.setUndoRemovedItemsResetTask(State, task);
        return State;
    }

    static toStorageLocalStateFormat(localState) {
        return Object.keys(localState).reduce((newState, domain) => {
            return {
                ...newState,
                [domain]: JSON.stringify(localState[domain])
            }
        }, {});
    }

    static toStorageSyncStateFormat(syncState) {
        return mapValues(syncState, v => {
            return JSON.stringify(v);
        })
    }

    static getNotifications$() {
        return StateManager.getState$().pipe(
            map(state => state.notifications),
            take(1)
        );
    }

    static getNotification$(notificationId) {
        return StateManager.getState$().pipe(
            map(state => state.notifications[notificationId]),
            take(1)
        );
    }
}

export default StateManager;
