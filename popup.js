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
    const {recordActive, autoSaveEnabled, isPriceUpdateEnabled} = state;
    updateRecordButton(recordActive);
    if (autoSaveEnabled) {
        setPendingAutoSave();
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            chrome.runtime.sendMessage({type: "AUTO_SAVE.STATUS", payload: {id, url}},
                updateAutoSaveButton);
        });
    } else {
        updateAutoSaveButton(autoSaveEnabled);
    }

    if(isPriceUpdateEnabled) {
        setPendingPriceUpdate();
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            chrome.runtime.sendMessage({type: "AUTO_SAVE.STATUS", payload: {id, url}},
                updateAutoSaveButton);
        });
    } else {
        updatePriceUpdateButton(autoSaveEnabled);
    }
}

function updateRecordButton(buttonActive) {
    if (buttonActive) {
        recordButton.style.fill = "#c4111d";
    } else {
        recordButton.style.fill = "#54575e";
    }
}

function onAutoSaveClick() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
        chrome.runtime.sendMessage({type: "AUTO_SAVE.ATTEMPT", payload: {id, url}}, updateAutoSaveButton);
    });
}

function onAutoSaveMouseOver() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
        chrome.runtime.sendMessage({type: "AUTO_SAVE.HIGHLIGHT.PRE_START", payload: {id, url}});
    });
}

function onAutoSaveMouseOut() {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
        chrome.runtime.sendMessage({type: "AUTO_SAVE.HIGHLIGHT.PRE_STOP", payload: {id, url}});
    });
}

function updateAutoSaveButton(buttonEnabled) {
    if (buttonEnabled === true) {
        autoSaveButton.onclick = onAutoSaveClick;
        autoSaveButton.onmouseover = onAutoSaveMouseOver;
        autoSaveButton.onmouseout = onAutoSaveMouseOut;
        autoSaveButton.style.fill = "#4e9b5f";
        autoSaveButton.style.cursor = "pointer";
    } else if (buttonEnabled === false) {
        autoSaveButton.removeEventListener("click", onAutoSaveClick);
        autoSaveButton.removeEventListener("mouseover", onAutoSaveMouseOver);
        autoSaveButton.removeEventListener("mouseout", onAutoSaveMouseOut);
        autoSaveButton.style.fill = "#878a91";
    }
}

function updatePriceUpdateButton(buttonEnabled) {
    /*if (buttonEnabled === true) {
        priceUpdateButton.onclick = onPriceUpdateClick;
        priceUpdateButton.onmouseover = onPriceUpdateMouseOver;
        priceUpdateButton.onmouseout = onPriceUpdateMouseOut;
        priceUpdateButton.style.fill = "#4e9b5f";
        priceUpdateButton.style.cursor = "pointer";
    } else if (buttonEnabled === false) {
        priceUpdateButton.removeEventListener("click", onPriceUpdateClick);
        priceUpdateButton.removeEventListener("mouseover", onPriceUpdateMouseOver);
        priceUpdateButton.removeEventListener("mouseout", onPriceUpdateMouseOut);
        priceUpdateButton.style.fill = "#878a91";
    }*/
}

function setPendingAutoSave() {
    autoSaveButton.style.fill = "#62656c";
}

function setPendingPriceUpdate() {
    priceUpdateButton.style.fill = "#62656c";
}

bootstrap();

