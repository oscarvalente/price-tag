import {EMPTY, forkJoin} from "rxjs";
import {switchMap, tap, filter, map} from "rxjs/operators";
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

const {
    POPUP_STATUS, RECORD_ATTEMPT, RECORD_START, RECORD_CANCEL, AUTO_SAVE_STATUS, AUTO_SAVE_CHECK_STATUS,
    AUTO_SAVE_ATTEMPT, PRICE_TAG_HIGHLIGHT_STOP
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

function listenRuntimeMessages() {
    return onMessage$(({payload: data, sendResponse$}) => {
        const {type, payload = {}} = data;
        const {id} = payload;
        const {recordActive, autoSaveEnabled, isPriceUpdateEnabled, domain, currentURL} = StateManager.getState();
        switch (type) {
            case POPUP_STATUS:
                return sendResponse$({status: 1, state: {recordActive, autoSaveEnabled, isPriceUpdateEnabled}});
            case RECORD_ATTEMPT:
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
                        tap(([, forcePageTrackingTo]) => {
                            if (forcePageTrackingTo) {
                                setTrackedItemAppearance();
                                StateManager.enableCurrentPageTracked();
                            } else {
                                setDefaultAppearance();
                                StateManager.disableCurrentPageTracked();
                            }
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
            case AUTO_SAVE_STATUS:
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
            case AUTO_SAVE_ATTEMPT:
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
                                                                            }).pipe(tap(onSimilarElementHighlight)),
                                                                            updateExtensionAppearance$(domain, url, true),
                                                                            sendResponse$(false)
                                                                        )
                                                                    )
                                                                );
                                                            } else {
                                                                // For Exceptions (including when there's similar item - should be caught by "AUTO_SAVE.STATUS")
                                                                if (!autoSaveStatus) {
                                                                    StateManager.disableAutoSave();
                                                                }
                                                                return sendResponse$(false);
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
                                                        }).pipe(tap(onSimilarElementHighlight)),
                                                        updateExtensionAppearance$(domain, currentURL, true),
                                                        sendResponse$(false)
                                                    )
                                                )
                                            )
                                        )
                                    );
                                }
                            }
                        )
                    );
                } else {
                    return sendResponse$(false);
                }
            default:
                return EMPTY;
        }
    });
}

export default listenRuntimeMessages;
