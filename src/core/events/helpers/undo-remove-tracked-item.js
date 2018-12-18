import {of} from "rxjs";
import {switchMap} from "rxjs/operators";
import {matchesDomain} from "../../../utils/lang";
import ItemFactory from "../../factories/item";
import ITEM_STATUS from "../../../config/item-statuses";
import getStorageLocal from "../internal/get-storage-local";
import setStorageDomain from "../internal/set-storage-domain";
import updateStatusAndAppearance$ from "../update-status-and-appearance";

function undoRemoveTrackedItem(url, currentURL, fullURL) {
    return getStorageLocal().pipe(
        switchMap(result => {
            const resultKeys = Object.keys(result);
            for (let i = 0; i < resultKeys.length; i++) {
                const domain = resultKeys[i];
                if (matchesDomain(domain)) {
                    const domainData = result[domain];

                    const domainItems = JSON.parse(domainData) || null;
                    const item = domainItems[url] && ItemFactory.createItemFromObject(domainItems[url]);

                    if (item) {
                        item.updateTrackStatus(null, [ITEM_STATUS.WATCHED], null); // start watch again
                        domainItems[url] = item;

                        return setStorageDomain(domain, domainItems).pipe(
                            switchMap(() => (currentURL === url || fullURL === url ?
                                updateStatusAndAppearance$(url, domain, true, fullURL) :
                                of(undefined))
                            )
                        );
                    }
                }
            }

            return of(undefined);
        })
    );
}

export default undoRemoveTrackedItem;
