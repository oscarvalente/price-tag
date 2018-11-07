// TODO
import {forkJoin} from "rxjs";
import {filter, switchMap, mapTo} from "rxjs/operators";
import StateManager from "../../state-manager";
import {buildURLConfirmationPayload} from "../../../utils/view";
import sendTabMessage$ from "../internal/tabs-send-message";
import getStorageDomain from "../internal/get-storage-domain";
import setStorageDomain from "../internal/set-storage-domain";

function onCreateItemConfirm(tabId, domain) {
    const modalElementId = "price-tag--url-confirmation";
    return sendTabMessage$(tabId, {
        type: "CONFIRMATION_DISPLAY.CREATE",
        payload: {elementId: modalElementId}
    }).pipe(
        filter(({status}) => status === 1),
        switchMap(() => {
            const {canonicalURL, browserURL} = StateManager.getState();
            const payload = buildURLConfirmationPayload(canonicalURL, browserURL, domain);
            return sendTabMessage$(tabId, {
                type: "CONFIRMATION_DISPLAY.LOAD",
                payload
            }).pipe(
                switchMap(({status, index}) => {
                    const message$ = sendTabMessage$(tabId, {
                        type: "CONFIRMATION_DISPLAY.REMOVE",
                        payload: {elementId: modalElementId}
                    });

                    const {canonicalURL, browserURL} = StateManager.getState();

                    switch (status) {
                        case 1:
                            switch (index) {
                                case 0:
                                    // said Yes, can use canonical and remember this option
                                    return getStorageDomain(domain).pipe(
                                        switchMap(domainState => {
                                            domainState._canUseCanonical = true;
                                            const {canonicalURL} = StateManager.getState();
                                            StateManager.updateCurrentURL(canonicalURL);
                                            return forkJoin(
                                                message$,
                                                setStorageDomain(domain, domainState)
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
                                    return getStorageDomain(domain).pipe(
                                        switchMap(domainState => {
                                            domainState._canUseCanonical = false;
                                            const {browserURL} = StateManager.getState();
                                            StateManager.updateCurrentURL(browserURL);
                                            return forkJoin(
                                                message$,
                                                setStorageDomain(domain, domainState)
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
