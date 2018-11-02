import {fromEventPattern} from 'rxjs';
import {take, map} from "rxjs/operators";

function getStorageDomain(domain) {
    return fromEventPattern(handler => {
        chrome.storage.local.get([domain], handler);
    }).pipe(
        take(1),
        map(result =>
            (result && result[domain] ? JSON.parse(result[domain]) : {})
        )
    );
}

export default getStorageDomain;
