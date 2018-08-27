chrome.runtime.onInstalled.addListener(() => {
	console.log("Price tag installed.");
});

chrome.runtime.onMessage.addListener(
    (message, callback) => {
		if (message === "select") {
        	chrome.tabs.executeScript({
          		code: "document.body.style.backgroundColor=\"orange\""
        	});
      	}
});

