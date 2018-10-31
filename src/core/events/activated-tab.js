import {map, switchMap} from "rxjs/operators";
import queryActiveTab$ from "./internal/query-active-tab";
import onActivated$ from "./internal/activated";

function onActivatedTab() {
    return onActivated$()
        .pipe(
            switchMap(() => queryActiveTab$()),
            map(([{id, url}]) => ({
                    id,
                    url
                })
            )
        );
}

export default onActivatedTab;
