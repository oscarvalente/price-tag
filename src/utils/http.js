import {from} from "rxjs";
import {take} from "rxjs/operators";
import {createHTMLTemplate} from "./dom";

function makeXHR(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function () {
            const template = createHTMLTemplate(xhr.response);
            resolve(template);
        });
        xhr.addEventListener("error", reject);
        xhr.open("GET", url);
        xhr.send();
    });
}

function onXHR$(url) {
    return from(makeXHR(url)).pipe(
        take(1)
    );
}

export {
    onXHR$
};
