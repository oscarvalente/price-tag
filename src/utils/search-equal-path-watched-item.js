import {captureHostAndPathFromURL, matchesURL} from "./lang";
import ItemFactory from "../core/factories/item";

function searchEqualPathWatchedItem(domainState, currentURL) {
    const currentHostAndPath = captureHostAndPathFromURL(currentURL);
    let foundOne = false;
    for (let url in domainState) {
        if (domainState.hasOwnProperty(url) && matchesURL(url)) {
            const item = ItemFactory.createItemFromObject(domainState[url]);
            if (item.isWatched()) {
                if (currentURL === url) {
                    //    if they're exactly the same
                    return null;
                } else {
                    const hostAndPath = captureHostAndPathFromURL(url);
                    if (hostAndPath === currentHostAndPath) {
                        foundOne = foundOne === false;
                        return url;
                    }
                }
            }
        }
    }

    return null;
}

export default searchEqualPathWatchedItem;
