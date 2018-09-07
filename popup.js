let recordButton;
let autoSaveButton;
let trackedItemsButton;

function bootstrap() {
    chrome.runtime.sendMessage({type: "POPUP.STATUS"}, onPopupStatus);

    recordButton = document.getElementById("record-btn");
    autoSaveButton = document.getElementById("auto-save-btn");
    trackedItemsButton = document.getElementById("tracked-items-btn");

    recordButton.onclick = () => {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            chrome.runtime.sendMessage({type: "RECORD.ATTEMPT", payload: {id, url}}, onPopupStatus);
        });
    };

    trackedItemsButton.onclick = () => {
        window.location.href = "tracked-items.html";
    };
}

function onPopupStatus({state}) {
    const {recordActive, autoSaveEnabled} = state;
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
    } else if (buttonEnabled === false) {
        autoSaveButton.removeEventListener("click", onAutoSaveClick);
        autoSaveButton.removeEventListener("mouseover", onAutoSaveMouseOver);
        autoSaveButton.removeEventListener("mouseout", onAutoSaveMouseOut);
        autoSaveButton.style.fill = "#878a91";
    }
}

function setPendingAutoSave() {
    autoSaveButton.style.fill = "#62656c";
}

bootstrap();

