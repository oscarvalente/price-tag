import {forkJoin} from "rxjs";
import {filter, switchMap, mapTo} from "rxjs/operators";
import StateManager from "../../state-manager";
import {buildURLConfirmationPayload} from "../../../utils/view";
import sendTabMessage$ from "../internal/tabs-send-message";
import getStorageDomain$ from "../internal/get-storage-domain";
import setStorageDomain$ from "../internal/set-storage-domain";
import {EXTENSION_MESSAGES} from "../../../config/background";

const {
    CONFIRMATION_DISPLAY_CREATE,
    CONFIRMATION_DISPLAY_LOAD,
    CONFIRMATION_DISPLAY_REMOVE
} = EXTENSION_MESSAGES;

function onCreateItemConfirm(tabId, domain) {
    const modalElementId = "price-tag--url-confirmation";
    return sendTabMessage$(tabId, {
        type: CONFIRMATION_DISPLAY_CREATE,
        payload: {elementId: modalElementId}
    }).pipe(
        filter(({status}) => status === 1),
        switchMap(() => {
            const {canonicalURL, browserURL} = StateManager.getState();
            const payload = buildURLConfirmationPayload(canonicalURL, browserURL, domain);
            return sendTabMessage$(tabId, {
                type: CONFIRMATION_DISPLAY_LOAD,
                payload
            }).pipe(
                switchMap(({status, index}) => {
                    const message$ = sendTabMessage$(tabId, {
                        type: CONFIRMATION_DISPLAY_REMOVE,
                        payload: {elementId: modalElementId}
                    });

                    const {canonicalURL, browserURL} = StateManager.getState();

                    switch (status) {
                        case 1:
                            switch (index) {
                                case 0:
                                    // said Yes, can use canonical and remember this option
                                    return getStorageDomain$(domain).pipe(
                                        switchMap(domainState => {
                                            domainState._canUseCanonical = true;
                                            const {canonicalURL} = StateManager.getState();
                                            StateManager.updateCurrentURL(canonicalURL);
                                            return forkJoin(
                                                message$,
                                                setStorageDomain$(domain, domainState)
                                            );
                                        }),
                                        mapTo([true, true])
                                    );
                                case 1:
                                    // said Yes, but use canonical just this time
                                    StateManager.updateCurrentURL(canonicalURL);
                                    return message$.pipe(
                                        mapTo([true, true])
                                    );
                                case 2:
                                    // said No, use browser URL and remember this option
                                    return getStorageDomain$(domain).pipe(
                                        switchMap(domainState => {
                                            domainState._canUseCanonical = false;
                                            const {browserURL} = StateManager.getState();
                                            StateManager.updateCurrentURL(browserURL);
                                            return forkJoin(
                                                message$,
                                                setStorageDomain$(domain, domainState)
                                            );
                                        }),
                                        mapTo([true, false])
                                    );
                                case 3:
                                    // said No, use browser URL but ask again
                                    StateManager.updateCurrentURL(browserURL);
                                    return message$.pipe(
                                        mapTo([true, false])
                                    );
                                default:
                                    // cannot recognize this modal button click
                                    return message$.pipe(
                                        mapTo([false])
                                    );
                            }
                        default:
                            // 2: is close modal
                            return message$.pipe(
                                mapTo([false])
                            );
                    }
                })
            )
        })
    );
}

export default onCreateItemConfirm;
