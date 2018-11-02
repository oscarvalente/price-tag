function setStorageLocal(payload, handler) {
    chrome.storage.local.set(payload, handler);
}

export default setStorageLocal;
