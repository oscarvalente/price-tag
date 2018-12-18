import {matchesDomain, matchesURL} from "./lang";
import findKey from "lodash/findKey";
import defaultsDeep from "lodash/defaultsDeep";

function filterAllTrackedItems(result) {
    let filteredResult = {};
    for (let domain in result) {
        if (result.hasOwnProperty(domain) && matchesDomain(domain) && result[domain]) {
            const domainItems = JSON.parse(result[domain]);
            filteredResult = {
                ...filteredResult,
                [domain]: domainItems
            };
        }
    }
    return filteredResult;
}

function findURLKey(object) {
    return findKey(object, (_, key) => matchesURL(key));
}

function transformLocalToSyncStateFormat(localState, urlToDomainMap, cleanDomainFn) {
    const syncStateWithoutDomains = Object.keys(localState).reduce((newSyncState, domain) => {
        const cleanedDomain = cleanDomainFn(localState[domain]);

        return {
            ...cleanedDomain,
            ...newSyncState
        };
    }, {});

    // add _domain prop
    return defaultsDeep(syncStateWithoutDomains, urlToDomainMap);
}

export {
    filterAllTrackedItems,
    findURLKey,
    transformLocalToSyncStateFormat
};
