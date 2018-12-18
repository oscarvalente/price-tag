import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function getStorageSync() {
    return fromEventPattern(handler => {
        chrome.storage.sync.get(null, handler);
    }).pipe(
        take(1)
    );
}

export default getStorageSync;
