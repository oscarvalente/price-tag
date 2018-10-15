(function () {
    'use strict';

    chrome.runtime.onMessage.addListener(({
      type,
      payload
    }, sender, sendResponse) => {
      switch (type) {
        case "CONFIRMATION_DISPLAY.LOAD":
          const {
            documentTitle,
            title,
            message,
            buttons
          } = payload;
          document.querySelector("#document-title").innerText = documentTitle;
          document.querySelector("#modal #title").innerText = title;
          document.querySelector("#modal #message").innerHTML = message;
          buttons.forEach((title, index) => {
            let button = document.createElement("button");
            button.innerText = title;
            button.className = "button";
            document.querySelector("#modal #modal-footer").appendChild(button);

            button.onclick = function onClick() {
              sendResponse({
                status: 1,
                index
              });
            };
          });
          return true;

        default:
          return false;
      }
    });

}());
