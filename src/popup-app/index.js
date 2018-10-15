import React, {Component} from "react";
import styles from "./popup-app.css";

import Toolbar from "../components/toolbar";
import IconLink from "../components/icon-link";


const BUTTON_STATUS = {
    active: "active",
    inactive: "inactive",
    pending: "pending"
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

function updateAutosaveButton(buttonEnabled) {
    if (buttonEnabled === true) {
        this.setState(state => ({
            ...state,
            autosaveButtonStatus: BUTTON_STATUS.active
        }));
    } else if (buttonEnabled === false) {
        this.setState(state => ({
            ...state,
            autosaveButtonStatus: BUTTON_STATUS.inactive
        }));
    }
}

function updatePriceUpdateButton(buttonEnabled) {
    if (buttonEnabled === true) {
        this.setState(state => ({
            ...state,
            priceUpdateButtonStatus: BUTTON_STATUS.active
        }));
    } else if (buttonEnabled === false) {
        this.setState(state => ({
            ...state,
            priceUpdateButtonStatus: BUTTON_STATUS.inactive
        }));
    }
}

async function setPendingAutosave() {
    await this.setState(state => ({
        ...state,
        autosaveButtonStatus: BUTTON_STATUS.pending
    }));
}

async function setPendingPriceUpdate() {
    await this.setState(state => ({
        ...state,
        priceUpdateButtonStatus: BUTTON_STATUS.pending
    }));
}

class Popup extends Component {
    constructor(props) {
        super(props);
        this.onPopupStatus = this.onPopupStatus.bind(this);
        this.updateRecordButton = updateRecordButton.bind(this);
        this.updateAutosaveButton = updateAutosaveButton.bind(this);
        this.setPendingAutosave = setPendingAutosave.bind(this);
        this.updatePriceUpdateButton = updatePriceUpdateButton.bind(this);
        this.setPendingPriceUpdate = setPendingPriceUpdate.bind(this);

        this.state = {
            recordButtonStatus: BUTTON_STATUS.inactive,
            autosaveButtonStatus: BUTTON_STATUS.inactive,
            priceUpdateButtonStatus: BUTTON_STATUS.inactive
        };

        chrome.runtime.sendMessage({type: "POPUP.STATUS"}, this.onPopupStatus);
    }

    render() {
        return (
            <div>
                <Toolbar recordButtonStatus={this.state.recordButtonStatus}
                         autosaveButtonStatus={this.state.autosaveButtonStatus}
                         priceUpdateButtonStatus={this.state.priceUpdateButtonStatus}
                         onPopupStatus={this.onPopupStatus}
                         onAutosaveStatus={this.updateAutosaveButton}
                         onPriceUpdateStatus={this.updatePriceUpdateButton}
                />
                <IconLink href="tracked-items.html" icon="tracked-items" title="Tracked items"/>
            </div>
        );
    }

    onPopupStatus({state}) {
        const {recordActive, autoSaveEnabled} = state;

        this.updateRecordButton(recordActive);

        if (autoSaveEnabled) {
            this.setPendingAutosave();
            chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
                chrome.runtime.sendMessage({type: "AUTO_SAVE.STATUS", payload: {id}},
                    this.updateAutosaveButton);
            });
        } else {
            this.updateAutosaveButton(autoSaveEnabled);
        }

        this.setPendingPriceUpdate();
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "PRICE_UPDATE.STATUS", payload: {id}},
                this.updatePriceUpdateButton);
        });
    }
}

export default Popup;
