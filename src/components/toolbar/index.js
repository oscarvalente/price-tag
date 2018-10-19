import React, {Component} from "react";
import PropTypes from "prop-types";

import styles from "./toolbar.css";
import ToolbarButton from "../toolbar-button/index";

const BUTTON_STATUS = {
    active: "active",
    inactive: "inactive",
    pending: "pending"
};

function getAutosaveButton(buttonStatus) {
    return buttonStatus === BUTTON_STATUS.active ?
        <ToolbarButton id="auto-save-btn"
                       status={this.props.autosaveButtonStatus}
                       title="Save the detected price-tag in current page"
                       onClick={this.onAutosaveClick}
                       onMouseOver={this.onAutosaveMouseover}
                       onMouseOut={this.onAutosaveMouseout}
        /> :
        <ToolbarButton id="auto-save-btn"
                       title="Save the detected price-tag in current page"
                       status={this.props.autosaveButtonStatus}/>;
}

function getPriceUpdateButton(buttonStatus) {
    return buttonStatus === BUTTON_STATUS.active ?
        <ToolbarButton id="price-update-btn"
                       status={this.props.priceUpdateButtonStatus}
                       title="Update price-tag to current value"
                       onClick={this.onPriceUpdateClick}
                       onMouseOver={this.onPriceUpdateMouseover}
                       onMouseOut={this.onPriceUpdateMouseout}
        /> :
        <ToolbarButton id="price-update-btn"
                       title="Update price-tag to current value"
                       status={this.props.priceUpdateButtonStatus}/>;
}

class Toolbar extends Component {
    constructor(props) {
        super(props);
        this.onRecordClick = this.onRecordClick.bind(this);
        this.onAutosaveClick = this.onAutosaveClick.bind(this);
        this.onAutosaveMouseover = this.onAutosaveMouseover.bind(this);
        this.onAutosaveMouseout = this.onAutosaveMouseout.bind(this);
        this.onPriceUpdateClick = this.onPriceUpdateClick.bind(this);
        this.onPriceUpdateMouseover = this.onPriceUpdateMouseover.bind(this);
        this.onPriceUpdateMouseout = this.onPriceUpdateMouseout.bind(this);
    }

    render() {
        const createAutosaveButton = getAutosaveButton.bind(this, this.props.autosaveButtonStatus);
        const createPriceUpdateButton = getPriceUpdateButton.bind(this, this.props.priceUpdateButtonStatus);
        return (
            <ul className={styles["tracking-buttons"]}>
                <li>
                    <ToolbarButton id="record-btn"
                                   status={this.props.recordButtonStatus}
                                   title="Search for price-tag in current page"
                                   onClick={this.onRecordClick}/>
                </li>
                <li>
                    {createAutosaveButton()}
                </li>
                <li>
                    {createPriceUpdateButton()}
                </li>
            </ul>
        );
    }

    onRecordClick() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            chrome.runtime.sendMessage({type: "RECORD.ATTEMPT", payload: {id, url}}, this.props.onPopupStatus);
        });
    }

    onAutosaveClick() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "AUTO_SAVE.ATTEMPT", payload: {id}}, this.props.onAutosaveStatus);
        });
    }

    onAutosaveMouseover() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "AUTO_SAVE.HIGHLIGHT.PRE_START", payload: {id}});
        });
    }

    onAutosaveMouseout() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "AUTO_SAVE.HIGHLIGHT.PRE_STOP", payload: {id}});
        });
    }

    onPriceUpdateClick() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "PRICE_UPDATE.ATTEMPT", payload: {id}}, this.props.onPriceUpdateStatus);
        });
    }

    onPriceUpdateMouseover() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "PRICE_UPDATE.HIGHLIGHT.PRE_START", payload: {id}});
        });
    }

    onPriceUpdateMouseout() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "PRICE_UPDATE.HIGHLIGHT.PRE_STOP", payload: {id}});
        });
    }
}

Toolbar.propTypes = {
    autosaveButtonStatus: PropTypes.string,
    priceUpdateButtonStatus: PropTypes.string,
    recordButtonStatus: PropTypes.string,
    onPopupStatus: PropTypes.func,
    onAutosaveStatus: PropTypes.func,
    onPriceUpdateStatus: PropTypes.func
};

export default Toolbar;


