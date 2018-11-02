function getStorageLocal(key, handler) {
    chrome.storage.local.get(key, handler);
}

export default getStorageLocal;
