import {EMPTY, forkJoin, of} from "rxjs";
import {switchMap, tap, filter, map, catchError} from "rxjs/operators";
import isEmpty from "lodash/isEmpty";
import onMessage$ from "./internal/runtime-on-message";
import StateManager from "../state-manager";
import {EXTENSION_MESSAGES} from "../../config/background";
import sendTabMessage$ from "./internal/tabs-send-message";
import ITEM_STATUS from "../../config/item-statuses";
import canDisplayURLConfirmation$ from "./helpers/can-display-url-confirmation";
import onCreateItemConfirm$ from "./helpers/on-create-item-confirm";
import checkURLSimilarity$ from "./helpers/check-url-similarity";
import createItem$ from "./helpers/create-item";
import updateExtensionAppearance$ from "./update-extension-appearance";
import {setDefaultAppearance, setTrackedItemAppearance} from "./appearance";
import getStorageDomain$ from "./internal/get-storage-domain";
import searchEqualPathWatchedItem from "../../utils/search-equal-path-watched-item";
import {DISCONNECTED_PORT_MSG} from "../../constants/errors";
import ItemFactory from "../factories/item";
import {toPrice} from "../../utils/lang";
import setStorageDomain$ from "./internal/set-storage-domain";
import getTrackedItemsSortedBy$ from "./helpers/get-tracked-items-sorted-by";
import removeTrackedItem$ from "./helpers/remove-tracked-item";
import * as SORT_BY_TYPES from "../../config/sort-tracked-items";
import undoRemoveTrackedItem$ from "./helpers/undo-remove-tracked-item";
import onStatusAndAppearanceUpdate from "./helpers/on-status-and-appearance-update";

const {
    POPUP_STATUS, RECORD_ATTEMPT, RECORD_START, RECORD_CANCEL, AUTO_SAVE_STATUS, AUTO_SAVE_CHECK_STATUS,
    AUTO_SAVE_ATTEMPT, AUTO_SAVE_HIGHLIGHT_PRE_START, AUTO_SAVE_HIGHLIGHT_PRE_STOP, PRICE_TAG_HIGHLIGHT_START,
    PRICE_TAG_HIGHLIGHT_STOP, PRICE_UPDATE_STATUS, PRICE_UPDATE_CHECK_STATUS, PRICE_UPDATE_ATTEMPT,
    PRICE_UPDATE_HIGHLIGHT_PRE_START, PRICE_UPDATE_HIGHLIGHT_PRE_STOP, TRACKED_ITEMS_OPEN, TRACKED_ITEMS_GET,
    TRACKED_ITEMS_UNFOLLOW, TRACKED_ITEMS_CHANGE_SORT, TRACKED_ITEMS_UNDO_ATTEMPT
} = EXTENSION_MESSAGES;

function onRecordDone$(tabId, url, domain, payload) {
    const {selection, price, faviconURL, name} = payload;
    const State = StateManager.getState();
    StateManager.updateFaviconURL(State.faviconURL || faviconURL);
    StateManager.disableRecord();

    return canDisplayURLConfirmation$(State, domain).pipe(
        switchMap(canDisplay =>
            canDisplay ?
                onCreateItemConfirm$(tabId, domain, url, selection, price, faviconURL, name)
                    .pipe(
                        filter(([canSave]) => canSave),
                        switchMap(([, useCanonical]) => {
                            const {canonicalURL, browserURL} = StateManager.getState();
                            const url = useCanonical ? canonicalURL : browserURL;
                            return checkURLSimilarity$(tabId, domain, url);
                        })
                    ) :
                checkURLSimilarity$(tabId, domain, url)
        ),
        filter(([, isToSave]) => isToSave),
        tap(([url]) => StateManager.removeUndoRemovedItemByURL(url)),
        switchMap(([url]) =>
            forkJoin(
                createItem$(domain, url, selection, price, State.faviconURL, name, [ITEM_STATUS.WATCHED]),
                updateExtensionAppearance$(domain, url, true)
            )
        )
    );
}

function onRecordCancel() {
    StateManager.disableRecord();
}

function onAutoSaveCheckStatus({status, selection, price, faviconURL, name} = {}) {
    if (status >= 0) {
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State.faviconURL || faviconURL);
        StateManager.setSelectionInfo(selection, price, State.faviconURL, name);
        return true;
    } else {
        return false;
    }
}

function onPriceUpdateCheckStatus(trackedPrice, {status, selection, price, faviconURL, name} = {}) {
    if (status >= 0) {
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State.faviconURL || faviconURL);
        StateManager.setSelectionInfo(selection, price, State.faviconURL, name);
        if (toPrice(price) !== trackedPrice) {
            return true;
        }
    }

    return false;
}

function triggerAutoSaveCheckStatus$(tabId, url, selection, sendResponse$) {
    return sendTabMessage$(tabId, {
        type: AUTO_SAVE_CHECK_STATUS,
        payload: {url, selection}
    }).pipe(
        map(onAutoSaveCheckStatus),
        switchMap(buttonEnabled => sendResponse$(buttonEnabled))
    );
}

function onSimilarElementHighlight({status, isHighlighted: isSimilarElementHighlighted, originalBackgroundColor = null}) {
    if (status >= 0) {
        StateManager.setSimilarElementHighlight(isSimilarElementHighlighted, originalBackgroundColor);
    }
}

function updateExtensionAppearance(enableTrackedItemAppearance) {
    if (enableTrackedItemAppearance) {
        setTrackedItemAppearance();
        StateManager.enableCurrentPageTracked();
    } else {
        setDefaultAppearance();
        StateManager.disableCurrentPageTracked();
    }
}

function listenPopupStatus() {
    return onMessage$(POPUP_STATUS, ({sendResponse$}) => {
        const {recordActive, autoSaveEnabled, isPriceUpdateEnabled} = StateManager.getState();
        return sendResponse$({status: 1, state: {recordActive, autoSaveEnabled, isPriceUpdateEnabled}});
    });
}

function listenRecordAttempt() {
    return onMessage$(RECORD_ATTEMPT, ({payload: data, sendResponse$}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {domain} = StateManager.getState();
        /* eslint-disable no-case-declarations */
        const {recordActive: isRecordActive} = StateManager.toggleRecord();
        let message$;
        /* eslint-enable no-case-declarations */

        if (isRecordActive) {
            const {url} = payload;
            message$ = sendTabMessage$(id, {
                type: RECORD_START,
                payload: {url}
            }).pipe(
                filter(({status}) => status > 0),
                switchMap(onRecordDone$.bind(null, id, url, domain)),
                tap(([, isItemTracked]) => {
                    updateExtensionAppearance(isItemTracked);
                })
            );
        } else {
            message$ = sendTabMessage$(id, {
                type: RECORD_CANCEL
            }).pipe(
                tap(onRecordCancel)
            );
        }

        return forkJoin(
            message$,
            sendResponse$({status: 1, state: {recordActive: isRecordActive}})
        ).pipe(
            map(([, response]) => response)
        );
    });
}

function listenAutoSaveStatus() {
    return onMessage$(AUTO_SAVE_STATUS, ({payload: data, sendResponse$}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {domain, currentURL} = StateManager.getState();
        return getStorageDomain$(domain).pipe(
            switchMap(domainState => {
                    if (!isEmpty(domainState)) {
                        if (domainState._isPathEnoughToTrack === true) {
                            // since it's true we can say that that domain items' path is enough to track items in this domain
                            const similarURL = searchEqualPathWatchedItem(domainState, currentURL);

                            if (!similarURL) {
                                const {selection} = StateManager.getState();
                                return triggerAutoSaveCheckStatus$(id, currentURL, selection, sendResponse$);
                            } else {
                                return sendResponse$({status: -1});
                            }
                        } else {
                            const {selection} = StateManager.getState();
                            return triggerAutoSaveCheckStatus$(id, currentURL, selection, sendResponse$);
                        }
                    } else {
                        // domain doesn't exist
                        const {selection} = StateManager.getState();
                        return triggerAutoSaveCheckStatus$(id, currentURL, selection, sendResponse$);
                    }
                }
            )
        );
    });
}

function catchDisconnectedPort() {
    return catchError(({message}) => (message === DISCONNECTED_PORT_MSG ?
        of(false) :
        EMPTY)
    );
}

function listenAutoSaveAttempt() {
    return onMessage$(AUTO_SAVE_ATTEMPT, ({payload: data, sendResponse$}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {autoSaveEnabled, domain, currentURL} = StateManager.getState();
        if (autoSaveEnabled) {
            const state = StateManager.getState();
            const {selection, price, faviconURL, name, originalBackgroundColor}
                = state;

            return canDisplayURLConfirmation$(state, domain).pipe(
                switchMap(canDisplay => {
                        if (canDisplay) {
                            return onCreateItemConfirm$(id, domain, currentURL, selection, price, faviconURL, name).pipe(
                                filter(([canSave]) => canSave),
                                switchMap(([, useCaninocal]) => {
                                        const {canonicalURL, browserURL} = state;
                                        const url = useCaninocal ? canonicalURL : browserURL;

                                        return checkURLSimilarity$(id, domain, url).pipe(
                                            switchMap(([url, isToSave, autoSaveStatus]) => {
                                                    if (isToSave) {
                                                        StateManager.removeUndoRemovedItemByURL(url);
                                                        return createItem$(domain, url, selection, price, faviconURL, name, [ITEM_STATUS.WATCHED]).pipe(
                                                            tap(StateManager.disableAutoSave),
                                                            switchMap(() =>
                                                                forkJoin(
                                                                    sendTabMessage$(id, {
                                                                        type: PRICE_TAG_HIGHLIGHT_STOP,
                                                                        payload: {selection, originalBackgroundColor}
                                                                    }),
                                                                    updateExtensionAppearance$(domain, url, true)
                                                                )
                                                            ),
                                                            tap(([highlightStopPayload, isItemTracked]) => {
                                                                onSimilarElementHighlight(highlightStopPayload);
                                                                updateExtensionAppearance(isItemTracked);
                                                            }),
                                                            switchMap(() => sendResponse$(false)),
                                                            catchDisconnectedPort()
                                                        );
                                                    } else {
                                                        // For Exceptions (including when there's similar item - should be caught by "AUTO_SAVE.STATUS")
                                                        if (!autoSaveStatus) {
                                                            StateManager.disableAutoSave();
                                                        }
                                                        return sendResponse$(false).pipe(
                                                            catchDisconnectedPort()
                                                        );
                                                    }
                                                }
                                            )
                                        );
                                    }
                                )
                            );
                        } else {
                            return checkURLSimilarity$(id, domain, currentURL).pipe(
                                filter(([, isToSave]) => isToSave),
                                tap(([url]) => StateManager.removeUndoRemovedItemByURL(url)),
                                switchMap(([url]) =>
                                    createItem$(domain, url, selection, price, faviconURL, name, [ITEM_STATUS.WATCHED]).pipe(
                                        tap(StateManager.disableAutoSave),
                                        switchMap(() =>
                                            forkJoin(
                                                sendTabMessage$(id, {
                                                    type: PRICE_TAG_HIGHLIGHT_STOP,
                                                    payload: {selection, originalBackgroundColor}
                                                }),
                                                updateExtensionAppearance$(domain, url, true)
                                            )
                                        ),
                                        tap(([highlightStopPayload, isItemTracked]) => {
                                            onSimilarElementHighlight(highlightStopPayload);
                                            updateExtensionAppearance(isItemTracked);
                                        }),
                                        switchMap(() => sendResponse$(false)),
                                        catchDisconnectedPort()
                                    )
                                )
                            );
                        }
                    }
                )
            );
        } else {
            return sendResponse$(false).pipe(
                catchDisconnectedPort()
            );
        }
    });
}

function listenAutoSaveHighlightPreStart() {
    return onMessage$(AUTO_SAVE_HIGHLIGHT_PRE_START, ({payload: data}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {autoSaveEnabled,} = StateManager.getState();
        if (autoSaveEnabled) {
            const {selection} = StateManager.getState();
            return sendTabMessage$(id, {
                type: PRICE_TAG_HIGHLIGHT_START,
                payload: {selection}
            }).pipe(
                tap(onSimilarElementHighlight)
            );
        } else {
            return EMPTY;
        }
    });
}

function listenAutoSaveHighlightPreStop() {
    return onMessage$(AUTO_SAVE_HIGHLIGHT_PRE_STOP, ({payload: data}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {autoSaveEnabled} = StateManager.getState();
        if (autoSaveEnabled) {
            const {selection, originalBackgroundColor} = StateManager.getState();
            return sendTabMessage$(id, {
                type: PRICE_TAG_HIGHLIGHT_STOP,
                payload: {selection, originalBackgroundColor}
            }).pipe(
                tap(onSimilarElementHighlight)
            );
        } else {
            return EMPTY;
        }
    });
}

function listenPriceUpdateStatus() {
    return onMessage$(PRICE_UPDATE_STATUS, ({payload: data, sendResponse$}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {domain} = StateManager.getState();
        return getStorageDomain$(domain).pipe(
            switchMap(domainState => {
                const {currentURL, browserURL, selection} = StateManager.getState();
                const item = (domainState[currentURL] && ItemFactory.createItemFromObject(domainState[currentURL])) ||
                    (domainState[browserURL] && ItemFactory.createItemFromObject(domainState[browserURL]));
                return item ?
                    sendTabMessage$(id, {
                        type: PRICE_UPDATE_CHECK_STATUS,
                        payload: {selection}
                    }).pipe(
                        map(onPriceUpdateCheckStatus.bind(null, item.price)),
                        switchMap(buttonEnabled => sendResponse$(buttonEnabled))
                    ) :
                    sendResponse$(false);
            })
        );
    });
}

function listenPriceUpdateAttempt() {
    return onMessage$(PRICE_UPDATE_ATTEMPT, ({payload: data, sendResponse$}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {isPriceUpdateEnabled, currentURL, domain} = StateManager.getState();
        if (isPriceUpdateEnabled) {
            const {selection, price: updatedPrice, originalBackgroundColor} =
                StateManager.getState();
            const price = updatedPrice && toPrice(updatedPrice);
            return getStorageDomain$(domain).pipe(
                switchMap(domainState => {
                    const item = ItemFactory.createItemFromObject(domainState[currentURL]);

                    item.updateTrackStatus(price,
                        null,
                        [
                            ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE,
                            ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED,
                            ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE,
                            ITEM_STATUS.DECREASED, ITEM_STATUS.DECREASED,
                            ITEM_STATUS.NOT_FOUND
                        ]);
                    item.updateDiffPercentage();

                    domainState[currentURL] = item;
                    return forkJoin(
                        setStorageDomain$(domain, domainState),
                        sendTabMessage$(id, {
                            type: PRICE_TAG_HIGHLIGHT_STOP,
                            payload: {selection, originalBackgroundColor}
                        }).pipe(
                            tap(onSimilarElementHighlight)
                        )
                    ).pipe(
                        tap(StateManager.disablePriceUpdate),
                        switchMap(() => sendResponse$(false)),
                        catchDisconnectedPort()
                    );
                })
            );
        }
    });
}

function listenPriceUpdateHighlightPreStart() {
    return onMessage$(PRICE_UPDATE_HIGHLIGHT_PRE_START, ({payload: data}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {isPriceUpdateEnabled} = StateManager.getState();
        if (isPriceUpdateEnabled) {
            const {selection} = StateManager.getState();
            return sendTabMessage$(id, {
                type: PRICE_TAG_HIGHLIGHT_START,
                payload: {selection}
            }).pipe(
                tap(onSimilarElementHighlight)
            );
        } else {
            return EMPTY;
        }
    });
}

function listenPriceUpdateHighlightPreStop() {
    return onMessage$(PRICE_UPDATE_HIGHLIGHT_PRE_STOP, ({payload: data}) => {
        const {payload = {}} = data;
        const {id} = payload;
        const {isPriceUpdateEnabled} = StateManager.getState();
        if (isPriceUpdateEnabled) {
            const {selection, originalBackgroundColor} = StateManager.getState();
            return sendTabMessage$(id, {
                type: PRICE_TAG_HIGHLIGHT_STOP,
                payload: {selection, originalBackgroundColor}
            }).pipe(
                tap(onSimilarElementHighlight)
            );
        } else {
            return EMPTY;
        }
    });
}

function listenTrackedItemsOpen(sortItemsByType) {
    return onMessage$(TRACKED_ITEMS_OPEN, ({sendResponse$}) => {
        const State = StateManager.updateSortItemsBy(sortItemsByType);
        const isUndoStatusActive = State._undoRemovedItems.length > 0;
        return sendResponse$({isUndoStatusActive});
    });
}

function listenTrackedItemsGet() {
    return onMessage$(TRACKED_ITEMS_GET, ({sendResponse$}) => {
        const {_sortItemsBy} = StateManager.getState();
        return getTrackedItemsSortedBy$(_sortItemsBy).pipe(
            switchMap(sortedItemsList => sendResponse$(sortedItemsList))
        );
    });
}

function listenTrackedItemsUnfollow() {
    return onMessage$(TRACKED_ITEMS_UNFOLLOW, ({payload: data, sendResponse$}) => {
        const {payload = {}} = data;
        const {url} = payload;
        const {currentURL, browserURL} = StateManager.getState();
        return removeTrackedItem$(url, currentURL, browserURL).pipe(
            tap(onStatusAndAppearanceUpdate),
            switchMap(sortedItemsList => sendResponse$(sortedItemsList))
        );
    });
}

function listenTrackedItemsChangeSort() {
    return onMessage$(TRACKED_ITEMS_CHANGE_SORT, handler$ => of(handler$)).pipe(
        tap(({payload: data}) => {
            const {payload = {}} = data;
            const {sortByType} = payload;
            StateManager.updateSortItemsBy(SORT_BY_TYPES[sortByType]);
        }),
        switchMap(({sendResponse$}) => sendResponse$())
    );
}

function listenTrackedItemsUndoAttempt() {
    return onMessage$(TRACKED_ITEMS_UNDO_ATTEMPT, ({sendResponse$}) => {
        const {_undoRemovedItems} = StateManager.getState();
        if (_undoRemovedItems.length > 0) {
            const undoRemovedItem = StateManager.getUndoRemovedItemsHead();
            const State = StateManager.getState();
            const {currentURL, browserURL} = State;
            return undoRemoveTrackedItem$(undoRemovedItem.url, currentURL, browserURL).pipe(
                tap(onStatusAndAppearanceUpdate),
                switchMap(() => {
                    const {_undoRemovedItems} = StateManager.removeUndoRemovedItem(State);
                    return _undoRemovedItems.length === 0 ?
                        sendResponse$({isUndoStatusActive: false}) :
                        sendResponse$({isUndoStatusActive: true});
                })
            );
        } else {
            return sendResponse$({isUndoStatusActive: false})
        }
    });
}

export {
    listenPopupStatus,
    listenRecordAttempt,
    listenAutoSaveStatus,
    listenAutoSaveHighlightPreStart,
    listenAutoSaveHighlightPreStop,
    listenAutoSaveAttempt,
    listenPriceUpdateStatus,
    listenPriceUpdateAttempt,
    listenPriceUpdateHighlightPreStart,
    listenPriceUpdateHighlightPreStop,
    listenTrackedItemsOpen,
    listenTrackedItemsGet,
    listenTrackedItemsUnfollow,
    listenTrackedItemsChangeSort,
    listenTrackedItemsUndoAttempt
};
