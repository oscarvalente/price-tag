    function createHTMLTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content;
}

function getCanonicalPathFromSource(source) {
    const canonicalElement = source.querySelector("link[rel=\"canonical\"]");
    return canonicalElement && canonicalElement.getAttribute("href");
}

function getFaviconPath() {
    const nodeList = document.getElementsByTagName("link");
    for (let node of nodeList) {
        if (node.getAttribute("rel") === "icon" || node.getAttribute("rel") === "shortcut icon") {
            return node.getAttribute("href");
        }
    }
    return null;
}

function getFaviconURL() {
    const faviconPath = getFaviconPath();
    if (faviconPath) {
        if (faviconPath.startsWith(location.protocol) || faviconPath.startsWith("//")) {
            return faviconPath;
        } else if (faviconPath.startsWith("/")) {
            return `${location.protocol}//${location.hostname}${faviconPath}`;
        } else {
            return `${location.href}/${faviconPath}`;
        }
    }
    return null;
}

export {
    createHTMLTemplate,
    getCanonicalPathFromSource,
    getFaviconURL
};
