chrome.runtime.sendMessage({type: "POPUP.STATUS"}, onPopupStatus);

const recordButton = document.getElementById("record-btn");
const recordButtonImage = document.querySelector("#record-btn .analysis");

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
        recordButtonImage.style.fill = "#c4111d";
    } else {
        recordButtonImage.style.fill = "#878a91";
    }
}
