import cloneDeep from "lodash/cloneDeep";
import clone from "lodash/clone";
import get from "lodash/get";
import {interval, forkJoin} from "rxjs";
import {startWith, switchMap, map} from "rxjs/operators";
import {filterAllTrackedItems, transformLocalToSyncStateFormat} from "../../utils/storage";
import {matchesDomain, matchesURL} from "../../utils/lang";
import StateManager from "../state-manager";
import getStorage$ from "./internal/get-storage-local";
import getStorageSync$ from "./internal/get-storage-sync";
import setStorageLocal$ from "./internal/set-storage-local";
import setStorageSync$ from "./internal/set-storage-sync";

function cleanSyncItem(item) {
    const cleanedItem = clone(item);
    delete cleanedItem._domain;
    return cleanedItem;
}

function cleanLocalDomainState(domainState) {
    const cleanedDomainState = cloneDeep(domainState);
    delete cleanedDomainState._isPathEnoughToTrack;
    delete cleanedDomainState._canUseCanonical;
    return cleanedDomainState;
}

function createURLToDomainMap(state) {
    return Object.keys(state).reduce((urlsToDomainsMap, domain) => {
        if (matchesDomain(domain)) {
            const urlsToDomainMap = Object.keys(state[domain]).reduce((urlsToDomain, itemURL) => (matchesURL(itemURL) ?
                {
                    [itemURL]: {_domain: domain},
                    ...urlsToDomain
                } : urlsToDomain), {});

            return {
                ...urlsToDomainMap,
                ...urlsToDomainsMap
            };
        } else {
            return urlsToDomainsMap;
        }
    }, {});
}

function syncStorageState(freq) {
    return interval(freq).pipe(
        startWith(0),
        switchMap(() =>
            getStorage$()
        ),
        map(filterAllTrackedItems),
        switchMap(localState => {
                const freshLocalState = cloneDeep(localState);

                return getStorageSync$().pipe(
                    switchMap(syncState => {
                        for (let syncItemURL in syncState) {
                            if (syncState.hasOwnProperty(syncItemURL)) {
                                const syncItem = syncState[syncItemURL];

                                if (syncItem.hasOwnProperty("_domain") && matchesDomain(syncItem._domain)) {
                                    if (!freshLocalState[syncItem._domain]) {
                                        freshLocalState[syncItem._domain] = {
                                            [syncItemURL]: cleanSyncItem(syncItem)
                                        };
                                    } else if (!get(freshLocalState, [syncItem._domain, syncItemURL], null) ||
                                        syncItem.lastUpdateTimestamp > freshLocalState[syncItem._domain][syncItemURL].lastUpdateTimestamp) {
                                        freshLocalState[syncItem._domain][syncItemURL] = cleanSyncItem(syncItem);
                                    }
                                }
                            }
                        }

                        // TODO: sync domain preferences

                        const urlToDomainMap = createURLToDomainMap(freshLocalState);

                        const freshSyncState = transformLocalToSyncStateFormat(freshLocalState, urlToDomainMap, cleanLocalDomainState);

                        return forkJoin(
                            setStorageLocal$(StateManager.toStorageLocalStateFormat(freshLocalState)),
                            setStorageSync$(StateManager.toStorageSyncStateFormat(freshSyncState))
                        );
                    })
                )
            }
        ),
    );
}

export {
    syncStorageState
};
