import {of} from "rxjs";
import {switchMap, tap} from "rxjs/operators";
import {matchesDomain} from "../../../utils/lang";
import ItemFactory from "../../factories/item";
import StateManager from "../../state-manager";
import {EXTENSION_MESSAGES, MAX_UNDO_REMOVED_ITEMS, UNDO_REMOVED_ITEMS_TIMEOUT} from "../../../config/background";
import ITEM_STATUS from "../../../config/item-statuses";
import getStorage from "../internal/get-storage";
import sendRuntimeMessage$ from "../internal/runtime-send-message";
import updateStatusAndAppearance$ from "./update-status-and-appearance";
import setStorageDomain$ from "../internal/set-storage-domain";

const {TRACKED_ITEMS_SET_UNDO_STATUS} = EXTENSION_MESSAGES;

function removeTrackedItem(url, currentURL, fullURL) {
    return getStorage().pipe(
        switchMap(result => {
            const resultKeys = Object.keys(result);
            for (let i = 0; i < resultKeys.length; i++) {
                const domain = resultKeys[i];
                if (matchesDomain(domain)) {
                    const domainData = result[domain];
                    const domainItems = JSON.parse(domainData) || null;
                    const item = domainItems[url] && ItemFactory.createItemFromObject(domainItems[url]);
                    if (item) {
                        const {_undoRemovedItemsResetTask} = StateManager.getState();
                        if (_undoRemovedItemsResetTask) {
                            clearTimeout(_undoRemovedItemsResetTask);
                            StateManager.setUndoRemovedItemsResetTask(null);
                        }

                        const removedItem = {...item};
                        StateManager.addUndoRemovedItem(url, removedItem, MAX_UNDO_REMOVED_ITEMS);
                        return sendRuntimeMessage$({
                            type: TRACKED_ITEMS_SET_UNDO_STATUS,
                            payload: {isUndoStatusActive: true}
                        }).pipe(
                            tap(() => {
                                const undoRemovedItemsTask = setTimeout(() => {
                                    StateManager.resetUndoRemovedItems();
                                    chrome.runtime.sendMessage({
                                        type: TRACKED_ITEMS_SET_UNDO_STATUS,
                                        payload: {isUndoStatusActive: false}
                                    });
                                }, UNDO_REMOVED_ITEMS_TIMEOUT);

                                StateManager.setUndoRemovedItemsResetTask(undoRemovedItemsTask);
                            }),
                            switchMap(() => {
                                item.updateTrackStatus(null, null, [ITEM_STATUS.WATCHED]); // stop watching
                                domainItems[url] = item;
                                return setStorageDomain$(domain, domainItems).pipe(
                                    switchMap(() => (currentURL === url || fullURL === url ?
                                        updateStatusAndAppearance$(url, domain, false, fullURL) :
                                        of(undefined))
                                    )
                                );
                            })
                        );
                    }
                }
            }

            return of(undefined);
        })
    );
}

export default removeTrackedItem;
