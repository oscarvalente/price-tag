import {map, take} from "rxjs/operators";

import ItemFactory from "../../factories/item";
import getStorageDomain$ from "../internal/get-storage-domain";

function updatePriceUpdateStatus(url, domain, fullURL) {
    return getStorageDomain$(domain)
        .pipe(
            map(domainState => {
                const item = (domainState[url] && ItemFactory.createItemFromObject(domainState[url])) ||
                    (domainState[fullURL] && ItemFactory.createItemFromObject(domainState[fullURL]));
                const hasItemPriceIncOrDec = item && item.price !== item.currentPrice;
                if (hasItemPriceIncOrDec) {
                    return {
                        enable: true,
                        selection: item.selection
                    }
                } else {
                    return {
                        enable: false
                    };
                }
            }),
            take(1)
        );
}

export default updatePriceUpdateStatus;
