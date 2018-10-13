import React from "react";
import ReactDOM from "react-dom";
import Popup from "./src/popup-app";

let recordButton;
let recordButtonIcon;
let autoSaveButton;
let autoSaveButtonIcon;
let priceUpdateButton;
let priceUpdateButtonIcon;

function bootstrap() {
    chrome.runtime.sendMessage({type: "POPUP.STATUS"}, onPopupStatus);

    recordButton = document.getElementById("record-btn");
    recordButtonIcon = document.getElementById("record-btn-icon");
    autoSaveButton = document.getElementById("auto-save-btn");
    autoSaveButtonIcon = document.getElementById("auto-save-btn-icon");
    priceUpdateButton = document.getElementById("price-update-btn");
    priceUpdateButtonIcon = document.getElementById("price-update-btn-icon");

    recordButton.onclick = () => {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            chrome.runtime.sendMessage({type: "RECORD.ATTEMPT", payload: {id, url}}, onPopupStatus);
        });
    };

    //    react-lixo
    ReactDOM.render(React.createElement(Popup), document.getElementById('react-lixo'));
}

function onPopupStatus({state}) {
    const {recordActive, autoSaveEnabled} = state;
    updateRecordButton(recordActive);
    if (autoSaveEnabled) {
        setPendingAutoSave();
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "AUTO_SAVE.STATUS", payload: {id}},
                updateAutoSaveButton);
        });
    } else {
        updateAutoSaveButton(autoSaveEnabled);
    }

    setPendingPriceUpdate();
    chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
        chrome.runtime.sendMessage({type: "PRICE_UPDATE.STATUS", payload: {id}},
            updatePriceUpdateButton);
    });
}

function updateRecordButton(buttonActive) {
    if (buttonActive) {
        recordButtonIcon.style.fill = "#c4111d";
    } else {
        recordButtonIcon.style.fill = "#54575e";
    }
}

function onAutoSaveClick() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
        chrome.runtime.sendMessage({type: "AUTO_SAVE.ATTEMPT", payload: {id}}, updateAutoSaveButton);
    });
}

function onAutoSaveButtonMouseOver() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
        chrome.runtime.sendMessage({type: "AUTO_SAVE.HIGHLIGHT.PRE_START", payload: {id}});
    });
}

function onAutoSaveMouseOut() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
        chrome.runtime.sendMessage({type: "AUTO_SAVE.HIGHLIGHT.PRE_STOP", payload: {id}});
    });
}

function onPriceUpdateClick() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
        chrome.runtime.sendMessage({type: "PRICE_UPDATE.ATTEMPT", payload: {id}}, updatePriceUpdateButton);
    });
}

function onPriceUpdateButtonMouseOver() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
        chrome.runtime.sendMessage({type: "PRICE_UPDATE.HIGHLIGHT.PRE_START", payload: {id}});
    });
}

function onPriceUpdateMouseOut() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
        chrome.runtime.sendMessage({type: "PRICE_UPDATE.HIGHLIGHT.PRE_STOP", payload: {id}});
    });
}

function updateAutoSaveButton(buttonEnabled) {
    if (buttonEnabled === true) {
        autoSaveButton.onclick = onAutoSaveClick;
        autoSaveButton.onmouseover = onAutoSaveButtonMouseOver;
        autoSaveButton.onmouseout = onAutoSaveMouseOut;
        autoSaveButtonIcon.style.fill = "#4e9b5f";
        autoSaveButton.style.cursor = "pointer";
    } else if (buttonEnabled === false) {
        autoSaveButton.removeEventListener("click", onAutoSaveClick);
        autoSaveButton.removeEventListener("mouseover", onAutoSaveButtonMouseOver);
        autoSaveButton.removeEventListener("mouseout", onAutoSaveMouseOut);
        autoSaveButtonIcon.style.fill = "#878a91";
        autoSaveButton.style.cursor = "initial";
    }
}

function updatePriceUpdateButton(buttonEnabled) {
    if (buttonEnabled === true) {
        priceUpdateButton.onclick = onPriceUpdateClick;
        priceUpdateButton.onmouseover = onPriceUpdateButtonMouseOver;
        priceUpdateButton.onmouseout = onPriceUpdateMouseOut;
        priceUpdateButtonIcon.style.fill = "#4e9b5f";
        priceUpdateButton.style.cursor = "pointer";
    } else if (buttonEnabled === false) {
        priceUpdateButton.removeEventListener("click", onPriceUpdateClick);
        priceUpdateButton.removeEventListener("mouseover", onPriceUpdateButtonMouseOver);
        priceUpdateButton.removeEventListener("mouseout", onPriceUpdateMouseOut);
        priceUpdateButtonIcon.style.fill = "#878a91";
        priceUpdateButton.style.cursor = "initial";
    }
}

function setPendingAutoSave() {
    autoSaveButtonIcon.style.fill = "#62656c";
}

function setPendingPriceUpdate() {
    priceUpdateButtonIcon.style.fill = "#62656c";
}

bootstrap();

