import {matchesDomain} from "./lang";

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

export {
    filterAllTrackedItems
};
