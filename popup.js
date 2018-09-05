chrome.runtime.sendMessage({type: "POPUP.STATUS"}, onPopupStatus);

const recordButton = document.getElementById("record-btn");
const autoSaveButton = document.getElementById("auto-save-btn");

recordButton.onclick = () => {
    chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
        chrome.runtime.sendMessage({type: "RECORD.ATTEMPT", payload: {id, url}}, onPopupStatus);
    });
};

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

function updateAutoSaveButton(buttonEnabled) {
    console.log(buttonEnabled);
    if (buttonEnabled === true) {
        autoSaveButton.style.fill = "#4e9b5f";
        autoSaveButton.onclick = onAutoSaveClick;
    } else if (buttonEnabled === false) {
        autoSaveButton.removeEventListener("click", onAutoSaveClick);
        autoSaveButton.style.fill = "#878a91";
    }
}

function setPendingAutoSave() {
    autoSaveButton.style.fill = "#62656c";
}
