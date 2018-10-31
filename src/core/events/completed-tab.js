import {combineLatest} from "rxjs";
import {filter, map, switchMap} from "rxjs/operators";
import queryActiveTab$ from "./internal/query-active-tab";
import onCompleted$ from "./internal/completed";
import onHistoryStateUpdated$ from "./internal/history-state-updated";

function onCompletedTab() {
    const onNavigationCompleted$ = onCompleted$()
        .pipe(
            filter(frameId => frameId === 0),
        );
    const onCompletedTab$ = combineLatest(onNavigationCompleted$, onHistoryStateUpdated$());
    const getActiveTab$ = queryActiveTab$()
        .pipe(filter(tabs => tabs.length > 0));

    return onCompletedTab$.pipe(
        switchMap(() => getActiveTab$),
        map(([{id, url}]) => ({id, url})),
        filter(({url}) => url !== undefined)
    );
}

export default onCompletedTab;
