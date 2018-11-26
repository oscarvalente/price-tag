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
import getStorageDomain from "./internal/get-storage-domain";
import searchEqualPathWatchedItem from "../../utils/search-equal-path-watched-item";
import {DISCONNECTED_PORT_MSG} from "../../constants/errors";

const {
    POPUP_STATUS, RECORD_ATTEMPT, RECORD_START, RECORD_CANCEL, AUTO_SAVE_STATUS, AUTO_SAVE_CHECK_STATUS,
    AUTO_SAVE_ATTEMPT, AUTO_SAVE_HIGHLIGHT_PRE_START, AUTO_SAVE_HIGHLIGHT_PRE_STOP, PRICE_TAG_HIGHLIGHT_START,
    PRICE_TAG_HIGHLIGHT_STOP
} = EXTENSION_MESSAGES;

function onRecordDone$(tabId, url, domain, payload) {
    const {selection, price, faviconURL, faviconAlt} = payload;
    const State = StateManager.getState();
    StateManager.updateFaviconURL(State.faviconURL || faviconURL);
    StateManager.disableRecord();

    return canDisplayURLConfirmation$(State, domain).pipe(
        switchMap(canDisplay =>
            canDisplay ?
                onCreateItemConfirm$(tabId, domain, url, selection, price, faviconURL, faviconAlt)
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
        switchMap(([url]) =>
            forkJoin(
                createItem$(domain, url, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]),
                updateExtensionAppearance$(domain, url, true)
            )
        )
    );
}

function onRecordCancel() {
    StateManager.disableRecord();
}

function onAutoSaveCheckStatus({status, selection, price, faviconURL, faviconAlt} = {}) {
    if (status >= 0) {
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State.faviconURL || faviconURL);
        StateManager.setSelectionInfo(selection, price, State.faviconURL, faviconAlt);
        return true;
    } else {
        return false;
    }
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

function updateExtensionAppearance(isItemTracked) {
    if (isItemTracked) {
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
        return getStorageDomain(domain).pipe(
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
                        }
                        else {
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
            const {selection, price, faviconURL, faviconAlt, originalBackgroundColor}
                = state;

            return canDisplayURLConfirmation$(state, domain).pipe(
                switchMap(canDisplay => {
                        if (canDisplay) {
                            return onCreateItemConfirm$(id, domain, currentURL, selection, price, faviconURL, faviconAlt).pipe(
                                filter(([canSave]) => canSave),
                                switchMap(([, useCaninocal]) => {
                                        const {canonicalURL, browserURL} = state;
                                        const url = useCaninocal ? canonicalURL : browserURL;

                                        return checkURLSimilarity$(id, domain, url).pipe(
                                            switchMap(([url, isToSave, autoSaveStatus]) => {
                                                    if (isToSave) {
                                                        return createItem$(domain, url, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]).pipe(
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
                                switchMap(([currentURL]) =>
                                    createItem$(domain, currentURL, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]).pipe(
                                        tap(StateManager.disableAutoSave),
                                        switchMap(() =>
                                            forkJoin(
                                                sendTabMessage$(id, {
                                                    type: PRICE_TAG_HIGHLIGHT_STOP,
                                                    payload: {selection, originalBackgroundColor}
                                                }),
                                                updateExtensionAppearance$(domain, currentURL, true)
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

export {
    listenPopupStatus,
    listenRecordAttempt,
    listenAutoSaveStatus,
    listenAutoSaveHighlightPreStart,
    listenAutoSaveHighlightPreStop,
    listenAutoSaveAttempt
};
