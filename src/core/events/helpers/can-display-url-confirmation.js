import {map} from "rxjs/operators";
import isEmpty from "lodash/isEmpty";
import getStorageDomain$ from "../internal/get-storage-domain";

function canDisplayURLConfirmation(state, domain) {
    return getStorageDomain$(domain).pipe(
        map(domainState => {
            const isUseCanonicalPrefUnset = isEmpty(domainState) || domainState._canUseCanonical === undefined;
            return isUseCanonicalPrefUnset && !!state.canonicalURL &&
                state.canonicalURL !== state.browserURL;
        })
    );
}

export default canDisplayURLConfirmation;
