import {switchMap, tap} from "rxjs/operators";
import ItemFactory from "../../factories/item";
import {toPrice} from "../../../utils/lang";
import StateManager from "../../state-manager";
import getStorageDomain$ from "../internal/get-storage-domain";
import setStorageDomain$ from "../internal/set-storage-domain";

function createItem(domain, url, selection, price, faviconURL, faviconAlt, statuses) {
    return getStorageDomain$(domain).pipe(
        switchMap(domainState => {
            domainState[url] = ItemFactory.createItem(selection, toPrice(price), null, faviconURL, faviconAlt, statuses);

            return setStorageDomain$(domain, domainState).pipe(
                tap(StateManager.disableAutoSave)
                // TODO: sendResponse("done"); // foi gravado ou não
            );
        })
    );
}

export default createItem;
