chrome.runtime.onMessage.addListener(({type, payload}, sender, sendResponse) => {
    switch (type) {
        case "RECORD.START":
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

                document.body.removeEventListener("click", this);
                debugger;
                document.body.onmouseover = null;

                sendResponse({status: 1, url, domain, selection, price});
            };

            document.body.onmouseover = ({target}) => {
                target.addEventListener("mouseout", ({target}) => {
                    target.style.backgroundColor = originalBGColor;
                    target.removeEventListener("mouseout", this);
                });
                let originalBGColor = target.style.backgroundColor;
                target.style.backgroundColor = "#c9ecfc";
            };

            return true;
        case "RECORD.CANCEL":
            document.body.onclick = null;
            document.body.onmouseover = null;

            sendResponse({});
            break;
    }
});
