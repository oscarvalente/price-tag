import {createElement} from "react";
import {render} from "react-dom";
import TrackedItems from "./src/pages/tracked-items";

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
        isLower: item.statuses.includes(ITEM_STATUS.DECREASED),
        diffPercBackground: item.diffPercentage && item.diffPercentage > 0 ? "red" : "green"
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

function registerHelpers() {
    Handlebars.registerHelper("diffPercentage", value => {
        let percentage = parseInt(value, 10);
        // default: 1 digit
        let x = 110;
        let fontSize = 180;
        if (percentage >= 10 || percentage <= -10) {
            x = 50;
            fontSize = 175;
        }
        if (percentage >= 100 || percentage <= -100) {
            x = 60;
            fontSize = 170;
        }
        if (percentage > 0) {
            percentage = `+${percentage}`;
        }
        return new Handlebars.SafeString(
            `<text x="${x}" y="310" font-family="Verdana" font-weight="bold" font-size="${fontSize}" fill="#fff1cb" letter-spacing="-10">
                ${percentage}%
            </text>`
        );
    });
    Handlebars.registerHelper("targetPrice", function registerTargetPrice() {
        return this.price !== this.currentPrice ?
            new Handlebars.SafeString(`<span class="item-label target-price" title="Price the last time you marked it">${this.price}</span>`) :
            "";
    });
}

function setupUpdateTrackedItems() {
    updateTrackedItems();
    // TEMP: uncomment to refresh
    // setInterval(updateTrackedItems, REFRESH_INTERVAL);
}

function bootstrap() {
    registerHelpers();

    trackedItemsContainer = document.getElementById("tracked-items-container");
    listItemsLoader = loadTemplate("items-list");

    setupUpdateTrackedItems();
    render(createElement(TrackedItems), document.getElementById('tracked-items-page'));
}

function onItemRemoved(listItemElement, wasRemoved) {
    if (wasRemoved) {
        trackedItemsList.removeChild(listItemElement);
        if (trackedItemsList.children.length === 0) {
            updateTrackedItems();
        }
    }
}

bootstrap();
