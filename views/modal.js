import React, {createElement} from "react";
import {render} from "react-dom";

import ModalContainer from "../src/containers/modal-container";
import {EXTENSION_MESSAGES} from "../src/config/background";

const {
    CONFIRMATION_DISPLAY_LOAD
} = EXTENSION_MESSAGES;

const Title = ({title}) => (
    <title>{title}</title>
);

chrome.runtime.onMessage.addListener(({type, payload}, sender, sendResponse) => {
    switch (type) {
        case CONFIRMATION_DISPLAY_LOAD:
            console.log(new Date().getTime());
            const {documentTitle, title, message, buttons} = payload;

            render(createElement(Title, [{title: documentTitle}]), document.getElementById("document-title"));
            render(createElement(ModalContainer, {
                    title,
                    onCloseClick: () => {
                        sendResponse({status: 2});
                    },
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
});
