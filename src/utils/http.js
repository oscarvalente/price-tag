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

export {
    onXHR
};
