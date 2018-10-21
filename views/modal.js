import React, {createElement} from "react";
import {render} from "react-dom";

import ModalContainer from "../src/containers/modal-container";

const Title = ({title}) => (
    <title>{title}</title>
);

chrome.runtime.onMessage.addListener(({type, payload}, sender, sendResponse) => {
    switch (type) {
        case "CONFIRMATION_DISPLAY.LOAD":
            const {documentTitle, title, message, buttons} = payload;

            render(createElement(Title, [{title: documentTitle}]), document.getElementById("document-title"));
            render(createElement(ModalContainer, {
                    title,
                    message,
                    buttons,
                    generateOnButtonClickCallback: i => function onButtonClick() {
                        sendResponse({status: 1, index: i});
                    }
                }
            ), document.getElementById("modal-container"));

            return true;
        default:
            return false;
    }
})
;
