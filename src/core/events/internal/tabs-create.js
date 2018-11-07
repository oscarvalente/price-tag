import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";

function createTab(url) {
    return fromEventPattern(handler => {
        chrome.tabs.create({url}, handler);
    })
        .pipe(take(1));
}

export default createTab;
