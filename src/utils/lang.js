import MATCHES from "../constants/regexp";

function toPrice(price) {
    const priceNumber = parseFloat(price.replace(",", "."));
    const formattedPrice = priceNumber.toFixed(2);
    return parseFloat(formattedPrice);
}

function matchesHostnameAndPath(string) {
    return MATCHES.CAPTURE.HOSTNAME_AND_PATH.test(string);
}

function isCanonicalURLRelevant(canonical) {
    return canonical && matchesHostnameAndPath(canonical);
}

function matchesDomain(string) {
    return MATCHES.DOMAIN.test(string);
}

function matchesHostname(string) {
    return MATCHES.HOSTNAME.test(string);
}

function matchesURL(string) {
    return MATCHES.URL.test(string);
}

function parseDomainState(result, domain) {
    return result && result[domain] ? JSON.parse(result[domain]) : {};
}

function captureHostAndPathFromURL(url) {
    const captureHostAndPath = url.match(MATCHES.CAPTURE.HOSTNAME_AND_PATH);
    let hostAndPath = null;
    if (captureHostAndPath) {
        [, hostAndPath] = captureHostAndPath;
    }
    return hostAndPath;
}

function captureProtocolHostAndPathFromURL(url) {
    const captureProtocolHostAndPath = url.match(MATCHES.CAPTURE.PROTOCOL_HOSTNAME_AND_PATH);
    let protocolHostAndPath = null;
    if (captureProtocolHostAndPath) {
        [, protocolHostAndPath] = captureProtocolHostAndPath;
    }
    return protocolHostAndPath;
}

function captureDomainFromURL(url) {
    const domainCapture = url.match(MATCHES.CAPTURE.DOMAIN_IN_URL);
    if (domainCapture) {
        const [, domain] = domainCapture;
        return domain;
    } else {
        return null;
    }
}

export {
    matchesHostnameAndPath,
    isCanonicalURLRelevant,
    matchesDomain,
    matchesHostname,
    matchesURL,
    toPrice,
    parseDomainState,
    captureHostAndPathFromURL,
    captureProtocolHostAndPathFromURL,
    captureDomainFromURL
};
