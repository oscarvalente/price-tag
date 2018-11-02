import {fromEventPattern} from 'rxjs';
import {take, map} from "rxjs/operators";
import getStorageLocal from "./get-storage-local";

function getStorageDomain(domain) {
    return fromEventPattern(handler => {
        getStorageLocal([domain], handler);
    }).pipe(
        take(1),
        map(result =>
            (result && result[domain] ? JSON.parse(result[domain]) : {})
        )
    );
}

export default getStorageDomain;
