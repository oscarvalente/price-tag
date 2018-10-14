import React, {Component} from "react";
import Toolbar from "../components/toolbar";

import styles from "./popup-app.css";

const BUTTON_STATUS = {
    active: "active",
    inactive: "inactive"
};

function updateRecordButton(buttonActive) {
    if (buttonActive) {
        this.setState(state => ({
            ...state,
            recordButtonStatus: BUTTON_STATUS.active
        }));
    } else {
        this.setState(state => ({
            ...state,
            recordButtonStatus: BUTTON_STATUS.inactive
        }));
    }
}

class Popup extends Component {
    constructor(props) {
        super(props);
        this.onPopupStatus = this.onPopupStatus.bind(this);

        this.state = {recordButtonStatus: BUTTON_STATUS.inactive};
        chrome.runtime.sendMessage({type: "POPUP.STATUS"}, this.onPopupStatus);
    }

    render() {
        return (
            <Toolbar recordButtonStatus={this.state.recordButtonStatus} onPopupStatus={this.onPopupStatus}/>
        );
    }

    onPopupStatus({state}) {
        const {recordActive} = state;
        updateRecordButton.bind(this)(recordActive);
    }
}

export default Popup;
