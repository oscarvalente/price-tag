let trackedItemsList;
let listItemsLoader;

function loadTemplate(elementId) {
    const elementHTML = document.getElementById(elementId).innerHTML;
    return Handlebars.compile(elementHTML);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function onTrackedItems(rawItems) {
    const trackedItems = rawItems.map(item => ({
        ...item,
        dateTime: formatDate(item.timestamp)
    }));
    trackedItemsList.innerHTML = listItemsLoader({trackedItems});
    // trackedItems = [{url: "x", price: 2}];
}

function bootstrap() {
    trackedItemsList = document.getElementById("tracked-items-container");
    listItemsLoader = loadTemplate("items-list");

    chrome.runtime.sendMessage({type: "TRACKED_ITEMS.GET"}, onTrackedItems);
}

bootstrap();
