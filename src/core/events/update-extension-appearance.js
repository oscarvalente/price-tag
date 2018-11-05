import {of} from "rxjs";
import {map, take} from "rxjs/operators";
import isEmpty from "lodash/isEmpty";
import ItemFactory from "../factories/item";
import getStorageDomain from "./internal/get-storage-domain";

function updateExtensionAppearance(currentDomain, currentURL, forcePageTrackingTo, fullURL) {
    if (forcePageTrackingTo === true) {
        return of(true)
            .pipe(take(1));
    } else if (forcePageTrackingTo === false) {
        return of(false)
            .pipe(take(1));
    } else if (!forcePageTrackingTo) {
        return getStorageDomain(currentDomain)
            .pipe(
                map(domainState => {
                    if (!isEmpty(domainState)) {
                        // NOTE: Making sure that full URL is also checked because item may have been saved with full URL
                        // in the past
                        const itemObject = domainState[currentURL] || domainState[fullURL];
                        const item = itemObject && ItemFactory.createItemFromObject(itemObject);
                        if (item && item.isWatched()) {
                            return true;
                        }
                    }

                    return false;
                }),
                take(1)
            );
    }
}

export default updateExtensionAppearance;
