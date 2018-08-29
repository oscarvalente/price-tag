console.log("price tag");

const recordBtn = document.getElementById("record-btn");

let recordBtnStatus = false;

recordBtn.onclick = () => {
    recordBtnStatus = !recordBtnStatus;
    chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
        const {id, url} = tab;

        if (recordBtnStatus) {
            chrome.runtime.sendMessage({type: "RECORD.PRE_START", payload: {id, url}});
        } else {
            chrome.runtime.sendMessage({type: "RECORD.PRE_CANCEL", payload: {id}});
        }
    });
};
