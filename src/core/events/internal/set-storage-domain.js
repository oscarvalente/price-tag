import {fromEventPattern} from 'rxjs';
import {take} from "rxjs/operators";
import setStorageLocal from "./set-storage-local";

function setStorageDomain(domain, domainState) {
    return fromEventPattern(handler => {
        setStorageLocal({[domain]: JSON.stringify(domainState)}, handler);
    }).pipe(
        take(1)
    );
}

export default setStorageDomain;
