import React, {Component} from "react";
import PropTypes from "prop-types";
import isEqualWith from "lodash/isEqualWith";

import styles from "./tracked-items.scss";
import IconTitle from "../../components/icon-title";
import ItemsList from "../../components/items-list";
import OptionsList, {Option} from "../../components/options-list";
import {TIME, CURRENT_PRICE} from "../../config/sort-tracked-items";

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

function onSortChange({currentTarget}) {
    const {id: sortByType} = currentTarget;
    chrome.runtime.sendMessage({type: "TRACKED_ITEMS.CHANGE_SORT", payload: {sortByType}}, this.updateTrackedItems);
}

function onOpenedTrackedItems() {
    chrome.runtime.sendMessage({type: "TRACKED_ITEMS.OPEN"});
}

const BackButton = (props) => {
    return <a href={props.href} id={styles["back-btn"]}>&lt; Back</a>;
};

BackButton.propTypes = {
    href: PropTypes.string
};

function generateOnItemRemovedCallback(url) {
    return () => {
        chrome.runtime.sendMessage({
            type: "TRACKED_ITEMS.UNFOLLOW",
            payload: {url}
        }, this.updateTrackedItems);
    };
}


class TrackedItems extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: []
        };

        this.onTrackedItems = this.onTrackedItems.bind(this);
        this.onSortChange = onSortChange.bind(this);
        this.updateTrackedItems = updateTrackedItems.bind(this);
        this.generateOnItemRemovedCallback = generateOnItemRemovedCallback.bind(this);
        onOpenedTrackedItems();
    }

    componentDidMount() {
        this.updateTrackedItems();
        this.setupUpdate = window.setInterval(this.updateTrackedItems, REFRESH_INTERVAL);
    }

    componentWillUnmount() {
        window.clearInterval(this.setupUpdate);
    }

    shouldComponentUpdate(_, nextState) {
        return isEqualWith(this.state.items, nextState.items,
            ({timestamp: tsA}, {timestamp: tsB}) => tsA === tsB);
    }

    render() {
        return (
            <section className={styles.container}>
                <IconTitle icon="shopping" title="Tracked items"/>
                <OptionsList name="Sort by"
                             value={{optionsName: "sortItems", onChange: this.onSortChange}}>
                    <Option name="Time" id={TIME} isChecked={true}></Option>
                    <Option name="Price" id={CURRENT_PRICE}></Option>
                </OptionsList>
                <ItemsList items={this.state.items} generateOnItemRemovedCallback={this.generateOnItemRemovedCallback}/>
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
