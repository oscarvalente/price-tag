chrome.runtime.onMessage.addListener(({type, payload}, sender, sendResponse) => {
    switch (type) {
        case "RECORD.START":
            let originalBGColor;

            document.body.style.cursor = 'pointer';
            window.focus();
            document.body.onclick = ({target}) => {
                const {url} = payload;
                const {localName, className, id, innerText} = target;
                const selection = className ? `${localName}.${className}` :
                    id ? `${localName}#${className}` : localName; // TODO: Use document.querySelector
                let domain = null;
                let price = null;
                if (url) {
                    [, domain] = url.match(/https?:\/\/([\w.]+)\/*/);
                } else {
                    sendResponse({status: -1});
                }
                if (innerText) {
                    const innerTextMatch = innerText.match(/((?:\d+[.,])?\d+(?:[.,]\d+)?)/);
                    if (innerTextMatch) {
                        [, price] = innerTextMatch;
                    } else {
                        sendResponse({status: -3});
                    }
                } else {
                    sendResponse({status: -2});
                }

                target.style.backgroundColor = originalBGColor;
                document.body.style.cursor = "";
                document.body.removeEventListener("click", this);
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
            const innerText = target ? target.innerText : null;
            if (innerText) {
                const innerTextMatch = innerText.match(/((?:\d+[.,])?\d+(?:[.,]\d+)?)/);
                if (innerTextMatch) {
                    [, price] = innerTextMatch;
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
