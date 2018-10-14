import React, {Component} from "react";

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
                       onClick={this.onAutosaveClick}
                       onMouseOver={this.onAutosaveMouseover}
                       onMouseOut={this.onAutosaveMouseout}
        /> :
        <ToolbarButton id="auto-save-btn"
                       status={this.props.autosaveButtonStatus}/>;
}

class Toolbar extends Component {
    constructor(props) {
        super(props);
        this.onRecordClick = this.onRecordClick.bind(this);
        this.onAutosaveClick = this.onAutosaveClick.bind(this);
        this.onAutosaveMouseover = this.onAutosaveMouseover.bind(this);
        this.onAutosaveMouseout = this.onAutosaveMouseout.bind(this);
    }

    render() {
        const createAutosaveButton = getAutosaveButton.bind(this, this.props.autosaveButtonStatus);
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
                <li id="price-update-btn">
                    <ToolbarButton/>
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
            chrome.runtime.sendMessage({type: "AUTO_SAVE.ATTEMPT", payload: {id}}, this.props.onPopupStatus);
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
}

export default Toolbar;


