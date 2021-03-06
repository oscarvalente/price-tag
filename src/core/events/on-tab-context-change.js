import {of} from "rxjs";
import {switchMap} from "rxjs/operators";
import StateManager from "../state-manager";
import {captureDomainFromURL, captureProtocolHostAndPathFromURL, isCanonicalURLRelevant} from "../../utils/lang";
import {getCanonicalPathFromSource} from "../../utils/dom";
import {onXHR$} from "../../utils/http";
import getStorageDomain$ from "./internal/get-storage-domain";
import updateStatusAndAppearance$ from "./update-status-and-appearance";

function onTabContextChange(tabId, url) {
    const domain = captureDomainFromURL(url);
    if (domain) {
        StateManager.updateCurrentDomain(domain);
        return getStorageDomain$(domain).pipe(
            switchMap(domainState => {
                // check if user has already a preference to use the canonical URL if available
                if (domainState && domainState._canUseCanonical === false) {
                    StateManager.updateCanonicalURL(null);
                    StateManager.updateCurrentURL(url);
                    StateManager.updateBrowserURL(url);

                    if (domainState._isPathEnoughToTrack === true) {
                        const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                        if (protocolHostAndPathFromURL) {
                            StateManager.updateCurrentURL(protocolHostAndPathFromURL);
                            StateManager.updateBrowserURL(protocolHostAndPathFromURL);
                        }
                    }

                    const {currentURL, domain} = StateManager.getState();
                    return updateStatusAndAppearance$(currentURL, domain, null, url);
                } else {
                    // First thing to do, check:
                    // If canonical was updated (compared to the previously) + if it's relevant
                    StateManager.updateBrowserURL(url);

                    return onXHR$(url)
                        .pipe(
                            switchMap(template => {
                                const canonicalURL = getCanonicalPathFromSource(template);
                                const canUseCanonical = isCanonicalURLRelevant(canonicalURL);

                                if (canUseCanonical) {
                                    StateManager.updateCurrentURL(canonicalURL);
                                    StateManager.updateCanonicalURL(canonicalURL);
                                } else {
                                    StateManager.updateCanonicalURL(null);
                                    StateManager.updateCurrentURL(url);

                                    if (domainState && domainState._isPathEnoughToTrack === true) {
                                        const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);
                                        if (protocolHostAndPathFromURL) {
                                            StateManager.updateCurrentURL(protocolHostAndPathFromURL);
                                            StateManager.updateBrowserURL(protocolHostAndPathFromURL);
                                        }
                                    }
                                }

                                const {currentURL, domain} = StateManager.getState();
                                return updateStatusAndAppearance$(currentURL, domain, null, url);
                            })
                        );
                }
            })
        );
    } else {
        return of();
    }
}

export default onTabContextChange;
