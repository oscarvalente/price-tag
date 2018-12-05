import {forkJoin} from "rxjs";

import updateAutoSaveStatus$ from "./status/update-auto-save";
import updatePriceUpdateStatus$ from "./status/update-price-update";
import updateExtensionAppearance$ from "./update-extension-appearance";

function updateStatusAndAppearance(currentURL, domain, forcePageTrackingTo, url) {
    return forkJoin(
        updateAutoSaveStatus$(currentURL, domain, url),
        updatePriceUpdateStatus$(currentURL, domain, url),
        updateExtensionAppearance$(domain, currentURL, forcePageTrackingTo, url)
    );
}

export default updateStatusAndAppearance;
