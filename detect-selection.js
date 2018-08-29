chrome.runtime.onMessage.addListener(({type, payload}, sender, sendResponse) => {
    switch (type) {
        case "RECORD.START":
            document.body.onclick = ({target}) => {
                const {url} = payload;
                const {localName, className, id, innerText} = target;
                const selection = className ? `${localName}.${className}` :
                    id ? `${localName}#${className}` : localName; // TODO: Use document.querySelector
                let domain;
                let price;
                if (url) {
                    [, domain] = url.match(/https?:\/\/([\w.]+)\/*/);
                } else {
                    sendResponse({status: -1});
                }
                if (innerText) {
                    [, price] = innerText.match(/((?:\d+[.,])?\d+(?:[.,]\d+)?)/);
                } else {
                    sendResponse({status: -2});
                }

                document.body.removeEventListener('click', this);

                sendResponse({status: 1, url, domain, selection, price});
            };

            console.log('onclick');

            document.body.onmouseover = ({target}) => {
                target.addEventListener('mouseout', ({target}) => {
                    target.style.backgroundColor = originalBGColor;
                    target.removeEventListener('mouseout', this);
                });
                let originalBGColor = target.style.backgroundColor;
                target.style.backgroundColor = "#c9ecfc";
            };
            ;

            break;
        case "RECORD.CANCEL":
            document.body.onclick = null;
            document.body.onmouseover = null;

            sendResponse({status: 1});
            break;
        default:
            break;
    }

    return true;
});
