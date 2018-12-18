import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function setStorageSync(state) {
    return fromEventPattern(handler => {
        chrome.storage.sync.set(state, handler);
    }).pipe(
        take(1)
    );
}

export default setStorageSync;
