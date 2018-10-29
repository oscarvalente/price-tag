import {filterAllTrackedItems} from "../../utils/storage";
import {matchesDomain} from "../../utils/lang";
import StateFactory from "../factories/state";

function syncStorageState() {
    chrome.storage.local.get(null, localResult => {
        const localState = filterAllTrackedItems(localResult);

        chrome.storage.sync.get(null, syncResult => {
                const syncState = filterAllTrackedItems(syncResult);
                // TODO: replace this with a lodash cloneDeep !!
                const freshState = JSON.parse(JSON.stringify(localState));

                for (let syncDomain in syncState) {
                    if (syncState.hasOwnProperty(syncDomain) && matchesDomain(syncDomain)) {
                        const syncStateDomain = syncState[syncDomain];
                        if (!freshState[syncDomain]) {
                            // TODO: replace this with a lodash cloneDeep !!
                            freshState[syncDomain] = JSON.parse(JSON.stringify(syncStateDomain));
                        } else {
                            for (let syncUrl in syncStateDomain) {
                                if (syncStateDomain.hasOwnProperty(syncUrl)) {
                                    const syncItem = syncStateDomain[syncUrl];
                                    if (!freshState[syncDomain][syncUrl]) {
                                        freshState[syncDomain][syncUrl] = Object.assign({}, syncItem);
                                    } else if (syncItem.lastUpdateTimestamp > freshState[syncDomain][syncUrl].lastUpdateTimestamp) {
                                        // TODO: replace this with a lodash cloneDeep !!
                                        freshState[syncDomain][syncUrl] = JSON.parse(JSON.stringify(syncItem));
                                    }
                                }
                            }
                        }

                    }
                }

                chrome.storage.local.set(StateFactory.toStorageStateFormat(freshState));
                chrome.storage.sync.set(StateFactory.toStorageStateFormat(freshState));
            }
        );
    });
}

export {
    syncStorageState
};
