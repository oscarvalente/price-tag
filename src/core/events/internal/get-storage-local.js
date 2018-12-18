import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function getStorageLocal() {
    return fromEventPattern(handler => {
        chrome.storage.local.get(null, handler);
    }).pipe(
        take(1)
    );
}

export default getStorageLocal;
