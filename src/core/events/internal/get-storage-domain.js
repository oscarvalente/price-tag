import {fromEventPattern} from 'rxjs';
import {take, map} from "rxjs/operators";
import {parseDomainState} from "../../../utils/lang";

function getStorageDomain(domain) {
    return fromEventPattern(handler => {
        chrome.storage.local.get([domain], handler);
    }).pipe(
        take(1),
        map(result => parseDomainState(result, domain))
    );
}

export default getStorageDomain;
