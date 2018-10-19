import React, {Component} from "react";
import PropTypes from "prop-types";

import styles from "./tracked-items.scss";
import IconTitle from "../../components/icon-title";
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

const BackButton = (props) => {
    return <a href={props.href} id={styles["back-btn"]}>&lt; Back</a>;
};

BackButton.propTypes = {
    href: PropTypes.string
};


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
        this.setupUpdate = window.setInterval(this.updateTrackedItems, REFRESH_INTERVAL);
    }

    componentWillUnmount() {
        window.clearInterval(this.setupUpdate);
    }

    shouldComponentUpdate(_, nextState) {
        return this.state.items.length !== nextState.items.length;
    }

    render() {
        return (
            <section id={styles.container}>
                <IconTitle icon="shopping" title="Tracked items"/>
                <ItemsList items={this.state.items} onItemRemoved={this.updateTrackedItems}/>
                <BackButton href="popup.html"/>
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
                diffPercentage: item.diffPercentage
            }))
        }));
    }
}

export default TrackedItems;
