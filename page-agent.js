function buildElementSelection(path, maxElements) {
    const pathSelection = [];
    let elemCount = 1;
    for (let {localName, className, id} of path) {
        if (maxElements >= elemCount) {
            const pathElementSelection = className ?
                `${localName.trim()}.${className.trim().replace(/\s/g, ".")}` :
                id ?
                    `${localName.trim()}#${id}` :
                    localName.trim();
            pathSelection.push(pathElementSelection);
        } else {
            break;
        }
        elemCount++;
    }
    return pathSelection.reverse().join(" ");
}

function getFaviconPath() {
    let favicon = null;
    const nodeList = document.getElementsByTagName("link");
    for (let node of nodeList) {
        if (node.getAttribute("rel") === "icon" || node.getAttribute("rel") === "shortcut icon") {
            return node.getAttribute("href");
        }
    }
    return favicon;
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

function evaluateAutoSave(selection, url, domain, sendResponse) {
    const target = document.body.querySelector(selection);
    const textContent = target ? target.textContent : null;
    if (textContent) {
        const textContentMatch = textContent.match(/((?:\d+[.,])?\d+(?:[.,]\d+)?)/);
        if (textContentMatch) {
            const [, price] = textContentMatch;
            sendResponse({
                status: 1,
                url,
                domain,
                selection,
                price,
                faviconURL: getFaviconURL(),
                faviconAlt: document.title
            });
        } else {
            sendResponse({status: -2});
        }
    } else {
        sendResponse({status: -1});
    }
}

function displaySaveConfirmation(title, message, buttons = [], sendResponse) {
    const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;
    if (!location.ancestorOrigins.contains(extensionOrigin)) {
        const modalElement = document.createElement("iframe");
        modalElement.setAttribute("id", "price-tag--save-confirmation-modal");

        // Must be declared at web_accessible_resources in manifest.json
        modalElement.src = chrome.runtime.getURL("views/modal.html");
        modalElement.onload = () => {
            sendResponse({status: 1});
        };

        modalElement.style.cssText = "position:fixed;top:0;left:0;display:block;" +
            "width:700px;height:100%;z-index:1000;border:0;";

        document.body.appendChild(modalElement);

        return true;
    }

    sendResponse({status: -1});

    return false;
}

chrome.runtime.onMessage.addListener(({type, payload}, sender, sendResponse) => {
    switch (type) {
        case "RECORD.START":
            let originalBGColor;

            document.body.style.cursor = "pointer";
            window.focus();
            document.body.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                const {target, path} = event;
                const {url} = payload;
                const {textContent} = target;
                const selection = buildElementSelection(path, 3);
                let domain = null;
                let price = null;
                if (url) {
                    [, domain] = url.match(/https?:\/\/([\w.]+)\/*/);
                } else {
                    sendResponse({status: -1});
                }
                if (textContent) {
                    const textContentMatch = textContent.match(/((?:\d+[.,])?\d+(?:[.,]\d+)?)/);
                    if (textContentMatch) {
                        [, price] = textContentMatch;
                        sendResponse({
                            status: 1,
                            url,
                            domain,
                            selection,
                            price,
                            faviconURL: getFaviconURL(),
                            faviconAlt: document.title
                        });
                    } else {
                        sendResponse({status: -3});
                    }
                } else {
                    sendResponse({status: -2});
                }

                target.style.backgroundColor = originalBGColor;
                document.body.style.cursor = "";
                document.body.onclick = null;
                document.body.onmouseover = null;
            };

            document.body.onmouseover = ({target}) => {
                target.addEventListener("mouseout", ({target}) => {
                    target.style.backgroundColor = originalBGColor;
                    target.removeEventListener("mouseout", this);
                });
                originalBGColor = target.style.backgroundColor;
                target.style.backgroundColor = "#c9ecfc";
            };

            return true;
        case "RECORD.CANCEL":
            document.body.style.cursor = "";
            document.body.onclick = null;
            document.body.onmouseover = null;

            sendResponse({});
            break;
        case "AUTO_SAVE.CHECK_STATUS":
            const {selection, url} = payload;
            const domain = location.hostname;
            if (document.readyState !== "complete") {
                window.onload = () => {
                    evaluateAutoSave(selection, url, domain, sendResponse);

                    window.onload = null;
                };
                return true;
            } else {
                evaluateAutoSave(selection, url, domain, sendResponse);
                return false;
            }
        case "AUTO_SAVE.HIGHLIGHT.START":
            const {selection: elementSelection} = payload;
            const elementToHighlight = document.body.querySelector(elementSelection);
            if (elementToHighlight) {
                const originalBackgroundColor = elementToHighlight.style.backgroundColor;
                elementToHighlight.style.backgroundColor = "#c9ecfc";
                sendResponse({status: 1, isHighlighted: true, originalBackgroundColor});
            } else {
                sendResponse({status: -1});
            }
            break;
        case "AUTO_SAVE.HIGHLIGHT.STOP":
            const {selection: elementHighlighted} = payload;
            let {originalBackgroundColor} = payload;
            originalBackgroundColor = originalBackgroundColor || "";
            const elementToStopHighlight = document.body.querySelector(elementHighlighted);
            if (elementToStopHighlight) {
                elementToStopHighlight.style.backgroundColor = originalBackgroundColor;
                sendResponse({status: 1, isHighlighted: false});
            } else {
                sendResponse({status: -1});
            }
            break;
        case "SIMILAR_ITEM.START_CONFIRMATION_DISPLAY":
            return displaySaveConfirmation(sendResponse);
    }
});
