let recordButton;
let autoSaveButton;
let priceUpdateButton;

function bootstrap() {
    chrome.runtime.sendMessage({type: "POPUP.STATUS"}, onPopupStatus);

    recordButton = document.getElementById("record-btn");
    autoSaveButton = document.getElementById("auto-save-btn");
    priceUpdateButton = document.getElementById("price-update-btn");

    recordButton.onclick = () => {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            chrome.runtime.sendMessage({type: "RECORD.ATTEMPT", payload: {id, url}}, onPopupStatus);
        });
    };
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
        recordButton.style.fill = "#c4111d";
    } else {
        recordButton.style.fill = "#54575e";
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
        autoSaveButton.style.fill = "#4e9b5f";
        autoSaveButton.style.cursor = "pointer";
    } else if (buttonEnabled === false) {
        autoSaveButton.removeEventListener("click", onAutoSaveClick);
        autoSaveButton.removeEventListener("mouseover", onAutoSaveButtonMouseOver);
        autoSaveButton.removeEventListener("mouseout", onAutoSaveMouseOut);
        autoSaveButton.style.fill = "#878a91";
    }
}

function updatePriceUpdateButton(buttonEnabled) {
    if (buttonEnabled === true) {
        priceUpdateButton.onclick = onPriceUpdateClick;
        priceUpdateButton.onmouseover = onPriceUpdateButtonMouseOver;
        priceUpdateButton.onmouseout = onPriceUpdateMouseOut;
        priceUpdateButton.style.fill = "#4e9b5f";
        priceUpdateButton.style.cursor = "pointer";
    } else if (buttonEnabled === false) {
        priceUpdateButton.removeEventListener("click", onPriceUpdateClick);
        priceUpdateButton.removeEventListener("mouseover", onPriceUpdateButtonMouseOver);
        priceUpdateButton.removeEventListener("mouseout", onPriceUpdateMouseOut);
        priceUpdateButton.style.fill = "#878a91";
    }
}

function setPendingAutoSave() {
    autoSaveButton.style.fill = "#62656c";
}

function setPendingPriceUpdate() {
    priceUpdateButton.style.fill = "#62656c";
}

bootstrap();

