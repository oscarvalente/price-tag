chrome.runtime.sendMessage({type: "RECORD.STATUS"}, onPopupStatus);

const recordButton = document.getElementById("record-btn");

recordButton.onclick = () => {
    chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
        const {id, url} = tab;
        chrome.runtime.sendMessage({type: "RECORD.ATTEMPT", payload: {id, url}}, onPopupStatus);
    });
};

function onPopupStatus({state}) {
    const {recordActive} = state;
    updateRecordButton(recordActive);
}

function updateRecordButton(buttonActive) {
    if (buttonActive) {
        recordButton.style.backgroundColor = "#c4111d";
    } else {
        recordButton.style.backgroundColor = "#878a91";
    }
}
