import {EMPTY, concat} from "rxjs";
import {switchMap, tap, filter, concatMap} from "rxjs/operators";
import onMessage$ from "./internal/runtime-on-message";
import StateManager from "../state-manager";
import {EXTENSION_MESSAGES} from "../../config/background";
import sendTabMessage$ from "./internal/tabs-send-message";
import ITEM_STATUS from "../../config/item-statuses";
import canDisplayURLConfirmation$ from "./helpers/can-display-url-confirmation";
import onCreateItemConfirm$ from "./helpers/on-create-item-attempt-confirm";
import checkURLSimilarity$ from "./helpers/check-url-similarity";
import createItem$ from "./helpers/create-item";
import updateExtensionAppearance$ from "./update-extension-appearance";

const {POPUP_STATUS, RECORD_ATTEMPT, RECORD_START, RECORD_CANCEL} = EXTENSION_MESSAGES;

function onRecordDone$(tabId, payload) {
    const {status, selection, price, faviconURL, faviconAlt} = payload;
    const {currentURL: url, domain} = StateManager.getState();
    if (status > 0) {
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State.faviconURL || faviconURL);
        StateManager.disableRecord();

        return canDisplayURLConfirmation$(State, domain).pipe(
            switchMap(canDisplay => {
                if (canDisplay) {
                    return onCreateItemConfirm$(tabId, domain, url, selection, price, faviconURL, faviconAlt).pipe(
                        filter(([canSave]) => canSave),
                        switchMap(([canSave, useCanonical]) => {
                            const State = StateManager.getState();
                            const url = useCanonical ? State.canonicalURL : State.browserURL;
                            return checkURLSimilarity$(tabId, domain, url);
                        }),
                        filter(([isToSave]) => isToSave)
                    );
                } else {
                    return checkURLSimilarity$(tabId, domain, url).pipe(
                        filter(([isToSave]) => isToSave)
                    );
                }
            }),
            switchMap(() => {
                return createItem$(domain, url, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED])
                    .pipe(
                        concatMap(() => updateExtensionAppearance$(domain, url, true))
                    );
            })
        );
    }

    return EMPTY;
}

function onRecordCancel() {
    StateManager.disableRecord();
}

function listenRuntimeMessages() {
    return onMessage$().pipe(
        /* eslint-disable no-unused-vars */
        switchMap(({payload: data, sender, sendResponse$}) => {
            /* eslint-enable no-unused-vars */
            const {type, payload = {}} = data;
            const {recordActive, autoSaveEnabled, isPriceUpdateEnabled} = StateManager.getState();
            switch (type) {
                case POPUP_STATUS:
                    return sendResponse$({status: 1, state: {recordActive, autoSaveEnabled, isPriceUpdateEnabled}});
                case RECORD_ATTEMPT:
                    /* eslint-disable no-case-declarations */
                    const {recordActive: isRecordActive} = StateManager.toggleRecord();
                    /* eslint-enable no-case-declarations */

                    let message$;

                    if (isRecordActive) {
                        const {url} = payload;
                        message$ = sendTabMessage$(id, {
                            type: RECORD_START,
                            payload: {url}
                        }).pipe(
                            switchMap(onRecordDone$.bind(null, id))
                        );
                    } else {
                        message$ = sendTabMessage$(id, {
                            type: RECORD_CANCEL
                        }).pipe(
                            tap(onRecordCancel)
                        );
                    }

                    return message$.pipe(
                        concat(() =>
                            sendResponse$({status: 1, state: {recordActive: isRecordActive}})
                        )
                    );
                default:
                    return EMPTY;
            }
        })
    );
}

export default listenRuntimeMessages;
