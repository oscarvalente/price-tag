import {matchesDomain, matchesURL} from "./lang";
import findKey from "lodash/findKey";

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

export {
    filterAllTrackedItems,
    findURLKey
};
