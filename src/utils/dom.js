function createHTMLTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content;
}

function getCanonicalPathFromSource(source) {
    const canonicalElement = source.querySelector("link[rel=\"canonical\"]");
    return canonicalElement && canonicalElement.getAttribute("href");
}

export {
    createHTMLTemplate,
    getCanonicalPathFromSource
};
