import {merge} from "rxjs";
import {filter, map, switchMap} from "rxjs/operators";
import queryActiveTab$ from "./internal/query-active-tab";
import onCompleted$ from "./internal/completed";
import onHistoryStateUpdated$ from "./internal/history-state-updated";
import StateManager from "../state-manager";

function filterNavigation(getState$, navigation) {
    const {url} = navigation;

    return getState$().pipe(
        map(({browserURL}) => browserURL),
        filter(browserURL => url !== undefined && url !== browserURL),
        map(() => navigation)
    );
}

function listenCompletedTab() {
    const getActiveTab$ = queryActiveTab$()
        .pipe(filter(tabs => tabs.length > 0));

    const onNavigationCompleted$ = onCompleted$()
        .pipe(
            filter(frameId => frameId === 0),
            switchMap(() => getActiveTab$),
            map(([{id, url}]) => ({id, url}))
        );

    const onNavigationHistoryStateUpdated$ = onHistoryStateUpdated$().pipe(
        switchMap(() => getActiveTab$),
        map(([{id, url}]) => ({id, url})),
        switchMap(navigation => filterNavigation(StateManager.getState$, navigation))
    );

    return merge(onNavigationCompleted$, onNavigationHistoryStateUpdated$);
}

export default listenCompletedTab;
