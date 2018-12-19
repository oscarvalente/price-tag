import React, {Component} from "react";
import PropTypes from "prop-types";
import {Subject} from "rxjs";
import {switchMap} from "rxjs/operators";

import styles from "./toolbar.css";
import ToolbarButton from "../toolbar-button/index";
import queryActiveTab$ from "../../core/events/internal/query-active-tab";
import sendRuntimeMessage$ from "../../core/events/internal/runtime-send-message";
import {EXTENSION_MESSAGES} from "../../config/background";

const {
    RECORD_ATTEMPT,
    AUTO_SAVE_ATTEMPT,
    AUTO_SAVE_HIGHLIGHT_PRE_START,
    AUTO_SAVE_HIGHLIGHT_PRE_STOP,
    PRICE_UPDATE_ATTEMPT,
    PRICE_UPDATE_HIGHLIGHT_PRE_START,
    PRICE_UPDATE_HIGHLIGHT_PRE_STOP,
    STOP_FOLLOW_ATTEMPT
} = EXTENSION_MESSAGES;

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
                       title="Can't save any price-tag in current page"
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
                       title="Can't update price-tag in current page"
                       status={this.props.priceUpdateButtonStatus}/>;
}

function getStopFollowButton(buttonStatus) {
    return buttonStatus === BUTTON_STATUS.active ?
        <ToolbarButton id="stop-follow-btn"
                       status={this.props.stopFollowButtonStatus}
                       title="Stop following current current page item"
                       onClick={this.onStopFollowClick}
        /> :
        <ToolbarButton id="stop-follow-btn"
                       title="You're not following the current page item"
                       status={this.props.stopFollowButtonStatus}/>;
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
        this.onStopFollowClick = this.onStopFollowClick.bind(this);

        this.stopFollowClick$ = new Subject();
        this.listenStopFollowClick$ = this.listenStopFollowClick$.bind(this);

        this.listenStopFollowClick$().subscribe(this.props.onItemChangedTrackStatus);
    }

    render() {
        const createAutosaveButton = getAutosaveButton.bind(this, this.props.autosaveButtonStatus);
        const createPriceUpdateButton = getPriceUpdateButton.bind(this, this.props.priceUpdateButtonStatus);
        const createStopFollowButton = getStopFollowButton.bind(this, this.props.stopFollowButtonStatus);

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
                <li>
                    {createStopFollowButton()}
                </li>
            </ul>
        );
    }

    onRecordClick() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id, url}]) => {
            chrome.runtime.sendMessage({type: RECORD_ATTEMPT, payload: {id, url}}, this.props.onPopupStatus);
        });
    }

    onAutosaveClick() {
        return queryActiveTab$().pipe(
            switchMap(([{id}]) => sendRuntimeMessage$({type: AUTO_SAVE_ATTEMPT, payload: {id}}))
        ).subscribe(this.props.onItemChangedTrackStatus);
    }

    onAutosaveMouseover() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: AUTO_SAVE_HIGHLIGHT_PRE_START, payload: {id}});
        });
    }

    onAutosaveMouseout() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: AUTO_SAVE_HIGHLIGHT_PRE_STOP, payload: {id}});
        });
    }

    onPriceUpdateClick() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: PRICE_UPDATE_ATTEMPT, payload: {id}}, this.props.onPriceUpdateStatus);
        });
    }

    onPriceUpdateMouseover() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: PRICE_UPDATE_HIGHLIGHT_PRE_START, payload: {id}});
        });
    }

    onPriceUpdateMouseout() {
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: PRICE_UPDATE_HIGHLIGHT_PRE_STOP, payload: {id}});
        });
    }

    listenStopFollowClick$() {
        return this.stopFollowClick$.pipe(
            switchMap(() => queryActiveTab$()),
            switchMap(([{id}]) =>
                sendRuntimeMessage$({type: STOP_FOLLOW_ATTEMPT, payload: {id}})
            )
        );
    }

    onStopFollowClick(e) {
        this.stopFollowClick$.next(e);
    }
}

Toolbar.propTypes = {
    autosaveButtonStatus: PropTypes.string,
    priceUpdateButtonStatus: PropTypes.string,
    recordButtonStatus: PropTypes.string,
    stopFollowButtonStatus: PropTypes.string,
    onPopupStatus: PropTypes.func,
    onItemChangedTrackStatus: PropTypes.func,
    onPriceUpdateStatus: PropTypes.func
};

export default Toolbar;


