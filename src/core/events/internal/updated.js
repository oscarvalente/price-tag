import {fromEventPattern} from "rxjs";
import {map} from "rxjs/operators";

function addUpdatedHandler(handler) {
    chrome.tabs.onUpdated.addListener(handler);
}

function onUpdated() {
    return fromEventPattern(addUpdatedHandler).pipe(
        map(([tabId, {favIconUrl}, {active, url}]) => ({
                tabId,
                favIconUrl,
                active,
                url
            })
        ));
}

export default onUpdated;
