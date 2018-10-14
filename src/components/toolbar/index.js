import React, {Component} from "react";

import styles from "./toolbar.css";
import ToolbarButton from "../toolbar-button/index";


class Toolbar extends Component {
    constructor(props) {
        super(props);
        this.onRecordClick = this.onRecordClick.bind(this)
    }

    render() {
        return (
            <ul className={styles["tracking-buttons"]}>
                <li id="record-btn">
                    <ToolbarButton id="record-btn"
                                   status={this.props.recordButtonStatus}
                                   title="Search for price-tag in current page"
                                   onClick={this.onRecordClick}/>
                </li>
                <li id="auto-save-btn">
                    <ToolbarButton/>
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
}

export default Toolbar;


