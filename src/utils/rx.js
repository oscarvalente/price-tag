import {of} from "rxjs";
import {take} from "rxjs/operators";

function transformCallbackToObservable(callback) {
    return returnValue => of(callback(returnValue)).pipe(
        take(1)
    );
}

export {transformCallbackToObservable};
