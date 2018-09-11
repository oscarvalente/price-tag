function buildElementSelection(path, maxElements) {
    const pathSelection = [];
    let elemCount = 1;
    for (let {localName, className, id} of path) {
        if (maxElements >= elemCount) {
            const pathElementSelection = className ? `${localName}.${className.replace(/\s/g, '.')}` :
                id ? `${localName}#${id}` : localName;
            pathSelection.push(pathElementSelection);
        } else {
            break;
        }
        elemCount++;
    }
    return pathSelection.reverse().join(" ");
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
                debugger;
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

                sendResponse({status: 1, url, domain, selection, price});
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
            const target = document.body.querySelector(selection);
            const textContent = target ? target.textContent : null;
            if (textContent) {
                const textContentMatch = textContent.match(/((?:\d+[.,])?\d+(?:[.,]\d+)?)/);
                if (textContentMatch) {
                    [, price] = textContentMatch;
                    sendResponse({status: 1, url, domain, selection, price});
                } else {
                    sendResponse({status: -2});
                }
            } else {
                sendResponse({status: -1});
            }
            break;
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
    }
});
