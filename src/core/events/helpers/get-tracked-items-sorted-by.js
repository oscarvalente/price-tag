import {map} from "rxjs/operators";
import {matchesDomain, matchesHostname} from "../../../utils/lang";
import ItemFactory from "../../factories/item";
import sortTrackedItemsBy from "../../../utils/sort-tracked-items";
import getStorage from "../internal/get-storage";

function getTrackedItemsSortedBy(sortType) {
    return getStorage().pipe(
        map(result => {
            let trackedItems = [];
            Object.keys(result).forEach(key => {
                if (matchesDomain(key)) {
                    const domainData = result[key];
                    const domainItems = JSON.parse(domainData) || null;
                    if (domainItems) {
                        let items = [];
                        Object.keys(domainItems).forEach(url => {
                            if (matchesHostname(url)) {
                                const item = ItemFactory.createItemFromObject(domainItems[url]);
                                if (item.isWatched()) {
                                    items.push({
                                        ...item,
                                        url
                                    });
                                }
                            }
                        });
                        trackedItems = [...trackedItems, ...items];
                    }
                }
            });
            const sortByFn = sortTrackedItemsBy[sortType];
            trackedItems.sort(sortByFn);

            return trackedItems;
        })
    );
}

export default getTrackedItemsSortedBy;
