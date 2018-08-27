console.log("price tag");

const recordBtn = document.getElementById("record-btn");

recordBtn.onclick = () => {
	//chrome.runtime.sendMessage({greeting: "hello"}, (response) => {
	//	console.log(response.farewell);
	//});

	chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
		chrome.tabs.executeScript(
          tab.id,
          {
			code: "document.body.style.backgroundColor = \"orange\";" +
			"document.body.onclick = ({path}) => {const [selection] = path;};"});
    });
};
