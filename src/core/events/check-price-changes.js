import {EMPTY, range, interval} from "rxjs";
import {switchMap, mergeMap, filter, startWith, map} from "rxjs/operators";
import {matchesDomain, matchesURL} from "../../utils/lang";
import ItemFactory from "../factories/item";
import {onXHR$} from "../../utils/http";
import getStorage$ from "./internal/get-storage";
import onPageFetch$ from "./helpers/on-page-fetch";

function checkPriceChanges(freq) {
    return interval(freq).pipe(
        startWith(0),
        switchMap(() =>
            getStorage$().pipe(
                filter(result => result),
                mergeMap(result => {
                    const domainsList = Object.keys(result);
                    return range(0, domainsList.length).pipe(
                        map(i => domainsList[i]),
                        filter(domain => result.hasOwnProperty(domain) && matchesDomain(domain)),
                        map(domain => ({domain, result}))
                    )
                }),
                mergeMap(({domain, result}) => {
                    const domainItems = JSON.parse(result[domain]);
                    const urlsList = Object.keys(domainItems);
                    return range(0, urlsList.length).pipe(
                        map(j => urlsList[j]),
                        filter(url => domainItems.hasOwnProperty(url) && matchesURL(url)),
                        map(url => ({url, domainItems, domain}))
                    );
                }),
                mergeMap(({url, domainItems, domain}) => {
                    const item = ItemFactory.createItemFromObject(domainItems[url]);

                    if (item.isWatched()) {
                        return onXHR$(url).pipe(
                            mergeMap(template => onPageFetch$(template, domain, url, domainItems, item))
                        );
                    } else {
                        return EMPTY;
                    }
                })
            )
        )
    )
}

export default checkPriceChanges;
