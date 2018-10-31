import {fromEventPattern} from 'rxjs';
import {map} from "rxjs/operators";

function addCompletedHandler(handler) {
    chrome.webNavigation.onCompleted.addListener(handler);
}

function onCompleted() {
    return fromEventPattern(addCompletedHandler).pipe(
        map(({frameId}) => frameId));
}

export default onCompleted;
