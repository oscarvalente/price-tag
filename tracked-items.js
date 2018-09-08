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
        isWatched: item.statuses.indexOf(ITEM_STATUS.WATCHED) > -1,
        isNotFound: item.statuses.indexOf(ITEM_STATUS.NOT_FOUND) > -1,
        hasDecreased: item.statuses.indexOf(ITEM_STATUS.DECREASED) > -1,
        hasIncreased: item.statuses.indexOf(ITEM_STATUS.INCREASED) > -1,
    }));
    trackedItemsContainer.innerHTML = listItemsLoader({trackedItems});

    trackedItemsList = document.getElementById("tracked-items-list");
    addRemoveEvents(".tracked-item-container .item-delete");
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
    chrome.runtime.sendMessage({type: "TRACKED_ITEMS.UNFOLLOW", payload: {url}}, onItemRemoved.bind(null, listItemElement));
}

function bootstrap() {
    trackedItemsContainer = document.getElementById("tracked-items-container");
    listItemsLoader = loadTemplate("items-list");

    chrome.runtime.sendMessage({type: "TRACKED_ITEMS.GET"}, onTrackedItems);
}

function onItemRemoved(listItemElement, wasRemoved) {
    if (wasRemoved) {
        trackedItemsList.removeChild(listItemElement);
    }
}

bootstrap();
