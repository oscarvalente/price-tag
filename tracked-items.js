let trackedItemsContainer;
let trackedItemsList;
let listItemsLoader;

const ITEM_STATUS = {
    WATCHED: "WATCHED",
    NOT_FOUND: "NOT_FOUND",
    INCREASED: "INCREASED",
    DECREASED: "DECREASED",
    FIXED: "FIXED"
};

const REFRESH_INTERVAL = 14000;

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
        dateTime: formatDate(item.timestamp),
        isWatched: item.statuses.includes(ITEM_STATUS.WATCHED),
        isNotFound: item.statuses.includes(ITEM_STATUS.NOT_FOUND),
        isHigher: item.statuses.includes(ITEM_STATUS.INCREASED),
        isLower: item.statuses.includes(ITEM_STATUS.DECREASED)
    }));
    trackedItemsContainer.innerHTML = listItemsLoader({trackedItems});

    trackedItemsList = document.getElementById("tracked-items-list");
    addRemoveEvents(".item-container .item-delete");
}

function addRemoveEvents(selection) {
    const deleteElements = document.body.querySelectorAll(selection);
    for (let elem in deleteElements) {
        if (deleteElements.hasOwnProperty(elem)) {
            const element = deleteElements[elem];
            const url = element.getAttribute("data-item-url");
            element.onclick = removeItem.bind(null, url, element.parentElement);
        }
    }
}

function removeItem(url, listItemElement) {
    chrome.runtime.sendMessage({
        type: "TRACKED_ITEMS.UNFOLLOW",
        payload: {url}
    }, onItemRemoved.bind(null, listItemElement));
}

function updateTrackedItems() {
    chrome.runtime.sendMessage({type: "TRACKED_ITEMS.GET"}, onTrackedItems);
}

function bootstrap() {
    trackedItemsContainer = document.getElementById("tracked-items-container");
    listItemsLoader = loadTemplate("items-list");

    updateTrackedItems();
    // window.setInterval(updateTrackedItems, REFRESH_INTERVAL);
}

function onItemRemoved(listItemElement, wasRemoved) {
    if (wasRemoved) {
        trackedItemsList.removeChild(listItemElement);
    }
}

bootstrap();
