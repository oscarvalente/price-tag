import React, {Component} from "react";

import styles from "./tracked-items.scss";
import ItemsList from "../../components/items-list";

const REFRESH_INTERVAL = 14000;

const ITEM_STATUS = {
    WATCHED: "WATCHED",
    NOT_FOUND: "NOT_FOUND",
    INCREASED: "INCREASED",
    DECREASED: "DECREASED",
    FIXED: "FIXED"
};

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function updateTrackedItems() {
    chrome.runtime.sendMessage({type: "TRACKED_ITEMS.GET"}, this.onTrackedItems);
}

class TrackedItems extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: []
        };

        this.onTrackedItems = this.onTrackedItems.bind(this);
        this.updateTrackedItems = updateTrackedItems.bind(this);
    }

    componentDidMount() {
        this.updateTrackedItems();
        this.setupUpdate = setInterval(this.updateTrackedItems, REFRESH_INTERVAL);
    }

    componentWillUnmount() {
        clearInterval(this.setupUpdate);
    }

    render() {
        return (
            <section id={styles.container}>
                <ItemsList items={this.state.items}/>
            </section>
        );
    }

    onTrackedItems(rawItems) {
        return this.setState(state => ({
            ...state,
            items: rawItems.map(item => ({
                ...item,
                dateTime: formatDate(item.timestamp),
                isWatched: item.statuses.includes(ITEM_STATUS.WATCHED),
                isNotFound: item.statuses.includes(ITEM_STATUS.NOT_FOUND),
                isHigher: item.statuses.includes(ITEM_STATUS.INCREASED),
                isLower: item.statuses.includes(ITEM_STATUS.DECREASED),
                diffPercentage: item.diffPercentage,
                // TODO: use ^ this in the view to apply v this
                diffPercBackground: item.diffPercentage && item.diffPercentage > 0 ? "red" : "green"
            }))
        }));
    }
}

export default TrackedItems;
