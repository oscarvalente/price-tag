import React, {Component, Fragment} from "react";
import {map, filter, tap, switchMap} from "rxjs/operators";

import Toolbar from "../../components/toolbar/index";
import IconLink from "../../components/icon-link/index";
import queryActiveTab$ from "../../core/events/internal/query-active-tab";
import sendRuntimeMessage$ from "../../core/events/internal/runtime-send-message";
import {EXTENSION_MESSAGES} from "../../config/background";


const {POPUP_STATUS, AUTO_SAVE_STATUS} = EXTENSION_MESSAGES;
const BUTTON_STATUS = {
    active: "active",
    inactive: "inactive",
    pending: "pending"
};

function updateRecordButton(buttonActive) {
    if (buttonActive) {
        this.setState({
            recordButtonStatus: BUTTON_STATUS.active
        });
    } else {
        this.setState({
            recordButtonStatus: BUTTON_STATUS.inactive
        });
    }
}

function updateAutosaveButton(buttonEnabled) {
    if (buttonEnabled === true) {
        this.setState({
            autosaveButtonStatus: BUTTON_STATUS.active
        });
    } else if (buttonEnabled === false) {
        this.setState({
            autosaveButtonStatus: BUTTON_STATUS.inactive
        });
    }
}

function updatePriceUpdateButton(buttonEnabled) {
    if (buttonEnabled === true) {
        this.setState({
            priceUpdateButtonStatus: BUTTON_STATUS.active
        });
    } else if (buttonEnabled === false) {
        this.setState({
            priceUpdateButtonStatus: BUTTON_STATUS.inactive
        });
    }
}

async function setPendingAutosave() {
    await this.setState({
        autosaveButtonStatus: BUTTON_STATUS.pending
    });
}

async function setPendingPriceUpdate() {
    await this.setState({
        priceUpdateButtonStatus: BUTTON_STATUS.pending
    });
}

class Popup extends Component {
    constructor(props) {
        super(props);
        this.onPopupStatus = this.onPopupStatus.bind(this);
        this.triggerPopupStatus$ = this.triggerPopupStatus$.bind(this);
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

        this.triggerPopupStatus$().subscribe(this.updateAutosaveButton);
    }

    render() {
        return (
            <Fragment>
                <Toolbar recordButtonStatus={this.state.recordButtonStatus}
                         autosaveButtonStatus={this.state.autosaveButtonStatus}
                         priceUpdateButtonStatus={this.state.priceUpdateButtonStatus}
                         onPopupStatus={this.onPopupStatus}
                         onAutosaveStatus={this.updateAutosaveButton}
                         onPriceUpdateStatus={this.updatePriceUpdateButton}
                />
                <IconLink href="tracked-items.html" icon="tracked-items" title="Tracked items"/>
            </Fragment>
        );
    }

    onPopupStatus({state}) {
        const {recordActive, autoSaveEnabled} = state;

        this.updateRecordButton(recordActive);

        if (!autoSaveEnabled) {
            this.updateAutosaveButton(autoSaveEnabled);
        }

        this.setPendingPriceUpdate();
        chrome.tabs.query({active: true, currentWindow: true}, ([{id}]) => {
            chrome.runtime.sendMessage({type: "PRICE_UPDATE.STATUS", payload: {id}},
                this.updatePriceUpdateButton);
        });
    }

    triggerPopupStatus$() {
        return sendRuntimeMessage$({type: POPUP_STATUS}).pipe(
            tap(this.onPopupStatus),
            map(({state}) => state.autoSaveEnabled),
            filter(autoSaveEnabled => autoSaveEnabled),
            tap(this.setPendingAutosave),
            switchMap(() => queryActiveTab$()),
            switchMap(([{id}]) =>
                sendRuntimeMessage$({type: AUTO_SAVE_STATUS, payload: {id}})
            )
        );
    }
}

export default Popup;
