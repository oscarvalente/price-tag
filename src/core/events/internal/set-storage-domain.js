import {fromEventPattern} from 'rxjs';
import {take} from "rxjs/operators";

function setStorageDomain(domain, domainState) {
    return fromEventPattern(handler => {
        chrome.storage.local.set({[domain]: JSON.stringify(domainState)}, handler);
    }).pipe(
        take(1)
    );
}

export default setStorageDomain;
