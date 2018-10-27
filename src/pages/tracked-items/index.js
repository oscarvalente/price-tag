import React, {Component} from "react";
import PropTypes from "prop-types";
import isEqualWith from "lodash/isEqualWith";
import isEqual from "lodash/isEqual";

import {TIME, CURRENT_PRICE} from "../../config/sort-tracked-items";
import styles from "./tracked-items.scss";
import IconTitle from "../../components/icon-title";
import ItemsList from "../../components/items-list";
import OptionsList, {Option} from "../../components/options-list";
import IconButton from "../../components/icon-button";

const REFRESH_INTERVAL = 14000;

const ITEM_STATUS = {
    WATCHED: "WATCHED",
    NOT_FOUND: "NOT_FOUND",
    INCREASED: "INCREASED",
    DECREASED: "DECREASED",
    FIXED: "FIXED"
};

const UNDO_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive"
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

function onOpenTrackedItemsResponse({isUndoStatusActive}) {
    this.setState({
        undoStatus: isUndoStatusActive ? UNDO_STATUS.ACTIVE : UNDO_STATUS.INACTIVE
    });
}

function onUndoAttemptResponse({isUndoStatusActive}) {
    this.updateTrackedItems();
    this.setState({
        undoStatus: isUndoStatusActive ? UNDO_STATUS.ACTIVE : UNDO_STATUS.INACTIVE
    });
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

function generateOnUndoRemoveClickCallback() {
    return () => {
        chrome.runtime.sendMessage({
            type: "TRACKED_ITEMS.UNDO_ATTEMPT"
        }, this.onUndoAttemptResponse);
    };
}

class TrackedItems extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [],
            undoStatus: UNDO_STATUS.INACTIVE
        };

        this.onTrackedItems = this.onTrackedItems.bind(this);
        this.onOpenedTrackedItems = this.onOpenedTrackedItems.bind(this);
        this.onSortChange = onSortChange.bind(this);
        this.updateTrackedItems = updateTrackedItems.bind(this);
        this.generateOnItemRemovedCallback = generateOnItemRemovedCallback.bind(this);
        this.generateOnUndoRemoveClickCallback = generateOnUndoRemoveClickCallback.bind(this);
        this.onOpenTrackedItemsResponse = onOpenTrackedItemsResponse.bind(this);
        this.onUndoAttemptResponse = onUndoAttemptResponse.bind(this);
    }

    componentDidMount() {
        this.onOpenedTrackedItems();
        this.updateTrackedItems();
        this.setupUpdate = window.setInterval(this.updateTrackedItems, REFRESH_INTERVAL);
    }

    componentWillUnmount() {
        window.clearInterval(this.setupUpdate);
    }

    shouldComponentUpdate(_, nextState) {
        return this.state.items.length !== nextState.items.length ||
            isEqualWith(this.state.items, nextState.items,
                ({timestamp: tsA, statuses: stA}, {timestamp: tsB, statuses: stB}) =>
                    tsA === tsB && isEqual(stA, stB)) ||
            this.state.undoStatus !== nextState.undoStatus;
    }

    render() {
        return (
            <section className={styles.container}>
                <IconTitle icon="shopping" title="Tracked items"/>
                <div className={styles["sub-header"]}>
                    <div className={`${styles["undo-button-container"]} ${styles[this.state.undoStatus]}`}>
                        <IconButton icon="undo" title="Undo remove item"
                                    onClick={this.generateOnUndoRemoveClickCallback()}/>
                    </div>
                    {
                        this.state.items.length > 0 &&
                        <OptionsList name="Sort by"
                                     value={{optionsName: "sortItems", onChange: this.onSortChange}}>
                            <Option name="Time" id={TIME} isChecked={true}></Option>
                            <Option name="Price" id={CURRENT_PRICE}></Option>
                        </OptionsList>
                    }
                </div>
                {
                    this.state.items.length > 0 &&
                    <ItemsList items={this.state.items}
                               generateOnItemRemovedCallback={this.generateOnItemRemovedCallback}/>
                    ||
                    <h4>No items currently being tracked.</h4>
                }
                <BackButton href="popup.html"/>
            </section>
        );
    }

    onTrackedItems(rawItems) {
        return this.setState({
            items: rawItems.map(item => ({
                ...item,
                dateTime: formatDate(item.timestamp),
                isWatched: item.statuses.includes(ITEM_STATUS.WATCHED),
                isNotFound: item.statuses.includes(ITEM_STATUS.NOT_FOUND),
                isHigher: item.statuses.includes(ITEM_STATUS.INCREASED),
                isLower: item.statuses.includes(ITEM_STATUS.DECREASED),
                diffPercentage: item.diffPercentage
            }))
        });
    }

    onOpenedTrackedItems() {
        chrome.runtime.sendMessage({type: "TRACKED_ITEMS.OPEN"}, this.onOpenTrackedItemsResponse);
        chrome.runtime.onMessage.addListener(({type, payload = {}}) => {
            const {isUndoStatusActive} = payload;
            switch (type) {
                case "TRACKED_ITEMS.UNDO_STATUS":
                    this.setState({
                        undoStatus: isUndoStatusActive ? UNDO_STATUS.ACTIVE : UNDO_STATUS.INACTIVE
                    });
                    break;
                default:
                    break;
            }
        });
    }
}

export default TrackedItems;
