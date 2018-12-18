import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function setStorageLocal(state) {
    return fromEventPattern(handler => {
        chrome.storage.local.set(state, handler);
    }).pipe(
        take(1)
    );
}

export default setStorageLocal;
