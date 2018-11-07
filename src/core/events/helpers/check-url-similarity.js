import isEmpty from "lodash/isEmpty";
import {of} from "rxjs";
import {switchMap, mapTo} from "rxjs/operators";
import {concat} from "rxjs";
import {buildSaveConfirmationPayload} from "../../../utils/view";
import getStorageDomain from "../internal/get-storage-domain";
import sendTabMessage from "../internal/tabs-send-message";
import searchEqualPathWatchedItem from "../../../utils/search-equal-path-watched-item";
import setStorageDomain from "../internal/set-storage-domain";

function checkURLSimilarity(tabId, domain, currentURL) {
    return getStorageDomain(domain).pipe(
        switchMap(domainState => {
            if (!isEmpty(domainState)) {
                if (domainState._isPathEnoughToTrack === true) {
                    // since it's true we can say that that domain items' path is enough to track items in this domain
                    const similarURL = searchEqualPathWatchedItem(domainState, currentURL);
                    if (similarURL) {
                        return of([false, false]);
                    } else {
                        return of([true]);
                    }
                } else if (domainState._isPathEnoughToTrack === false) {
                    return of([true]);
                } else {
                    // it's the first time user is being inquired about items similarity in this domain
                    const similarURL = searchEqualPathWatchedItem(domainState, currentURL);
                    if (similarURL) {
                        // found an URL whose host and path are equals to the currentURL trying to be saved
                        // prompt user to confirm if the item is the same

                        const modalElementId = "price-tag--save-confirmation";
                        return sendTabMessage(tabId, {
                            type: "CONFIRMATION_DISPLAY.CREATE",
                            payload: {elementId: modalElementId}
                        }).pipe(
                            switchMap(({status}) => {
                                if (status === 1) {
                                    const payload = buildSaveConfirmationPayload(currentURL, similarURL);
                                    return sendTabMessage(tabId, {
                                        type: "CONFIRMATION_DISPLAY.LOAD",
                                        payload
                                    }).pipe(
                                        switchMap(({status, index}) => {
                                            const message$ = sendTabMessage(tabId, {
                                                type: "CONFIRMATION_DISPLAY.REMOVE",
                                                payload: {elementId: modalElementId}
                                            });
                                            switch (status) {
                                                case 1:
                                                    switch (index) {
                                                        case 0:
                                                            // said Yes: not the same item
                                                            domainState._isPathEnoughToTrack = false;
                                                            chrome.storage.local.set({[domain]: JSON.stringify(domainState)});
                                                            return message$.pipe(
                                                                mapTo(true)
                                                            );
                                                        case 1:
                                                            return message$.pipe(
                                                                mapTo([false, true])
                                                            );
                                                        case 2:
                                                            // said No: same item (path is enough for this site items)
                                                            domainState._isPathEnoughToTrack = true;
                                                            return message$.pipe(
                                                                concat(setStorageDomain(domain, domainState)),
                                                                mapTo([false, false])
                                                            );
                                                        case 3:
                                                            // said Save this but for others Ask me later
                                                            return message$.pipe(
                                                                mapTo(true)
                                                            );
                                                        default:
                                                            // cannot recognize this modal button click
                                                            return message$.pipe(
                                                                mapTo([false, true])
                                                            );
                                                    }
                                                case 2:
                                                    // close modal
                                                    return message$.pipe(
                                                        mapTo([false, true])
                                                    );
                                                default:
                                                    // something wrong with modal interaction
                                                    return message$.pipe(
                                                        mapTo([false, true])
                                                    );
                                            }
                                        })
                                    );
                                } else {
                                    // something went wrong creating the modal
                                    return of([false, true]);
                                }
                            })
                        );
                    } else {
                        // no URL has host and path equals to the currentURL (can save the item)
                        return of([true]);
                    }
                }
            } else {
                // this means it's the first item being saved belonging to this domain (can save the item)
                return of([true]);
            }
        })
    );
}

export default checkURLSimilarity;
