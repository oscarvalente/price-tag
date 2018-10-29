import {DEFAULT_TITLE, TRACKED_ITEM_TITLE} from "../../config/background";
import {DEFAULT_ICON, TRACKED_ITEM_ICON} from "../../config/assets";

function setDefaultAppearance() {
    chrome.browserAction.setTitle({title: DEFAULT_TITLE});
    chrome.browserAction.setIcon({path: DEFAULT_ICON});
}

function setTrackedItemAppearance() {
    chrome.browserAction.setTitle({title: TRACKED_ITEM_TITLE});
    chrome.browserAction.setIcon({path: TRACKED_ITEM_ICON});
}

export {
    setDefaultAppearance,
    setTrackedItemAppearance
};
