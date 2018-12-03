import {map, take} from "rxjs/operators";
import ItemFactory from "../../factories/item";
import {findURLKey} from "../../../utils/storage";
import getStorageDomain$ from "../internal/get-storage-domain";

function updateAutoSaveStatus(url, domain, fullURL) {
    return getStorageDomain$(domain).pipe(
        map(domainState => {
            const item = domainState[url] && ItemFactory.createItemFromObject(domainState[url]);
            const itemFallback = domainState[fullURL] && ItemFactory.createItemFromObject(domainState[fullURL]);

            const isItemDefinedAndWatched = (item && item.isWatched()) ||
                (itemFallback && itemFallback.isWatched());
            if (domainState && !isItemDefinedAndWatched) {
                const urlFromDomain = findURLKey(domainState);
                const exampleFromDomain = domainState[urlFromDomain] && ItemFactory.createItemFromObject(domainState[urlFromDomain]);
                if (exampleFromDomain && exampleFromDomain.selection) {
                    return {
                        enable: true,
                        selection: exampleFromDomain.selection
                    };
                }
            }

            return {
                enable: false
            };
        }),
        take(1)
    );
}

export default updateAutoSaveStatus;
