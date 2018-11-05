import {fromEventPattern} from "rxjs";
import {take} from "rxjs/operators";
import {createHTMLTemplate} from "./dom";

function onXHR(url, callback) {
    const request = new XMLHttpRequest();
    request.onload = function () {
        const template = createHTMLTemplate(this.response);
        callback(template);
    };
    request.open("GET", url);
    request.send();
}

function onXHR$(url) {
    return fromEventPattern(handler => {
        onXHR(url, handler);
    }).pipe(
        take(1)
    );
}

export {
    onXHR,
    onXHR$
};
