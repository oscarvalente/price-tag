import React, {Component, Fragment} from "react";
import {of} from "rxjs";
import {map, filter, tap, switchMap, share} from "rxjs/operators";

import Toolbar from "../../components/toolbar/index";
import IconLink from "../../components/icon-link/index";
import queryActiveTab$ from "../../core/events/internal/query-active-tab";
import sendRuntimeMessage$ from "../../core/events/internal/runtime-send-message";
import {EXTENSION_MESSAGES} from "../../config/background";


const {POPUP_STATUS, AUTO_SAVE_STATUS, PRICE_UPDATE_STATUS, STOP_FOLLOW_STATUS} = EXTENSION_MESSAGES;
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

function updateStopFollowButton(buttonEnabled) {
    if (buttonEnabled === true) {
        this.setState({
            stopFollowButtonStatus: BUTTON_STATUS.active
        });
    } else if (buttonEnabled === false) {
        this.setState({
            stopFollowButtonStatus: BUTTON_STATUS.inactive
        });
    }
}

function onItemChangedTrackStatus({isAutoSaveEnabled, isStopFollowEnabled}) {
    this.updateAutosaveButton(isAutoSaveEnabled);
    this.updateStopFollowButton(isStopFollowEnabled);
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

async function setPendingStopFollow() {
    await this.setState({
        stopFollowButtonStatus: BUTTON_STATUS.pending
    });
}

class Popup extends Component {
    constructor(props) {
        super(props);
        this.onPopupStatus = this.onPopupStatus.bind(this);
        this.triggerPopupStatus$ = this.triggerPopupStatus$.bind(this);
        this.triggerAutoSaveStatus$ = this.triggerAutoSaveStatus$.bind(this);
        this.triggerPriceUpdateStatus$ = this.triggerPriceUpdateStatus$.bind(this);

        this.updateRecordButton = updateRecordButton.bind(this);
        this.updateAutosaveButton = updateAutosaveButton.bind(this);
        this.setPendingAutosave = setPendingAutosave.bind(this);
        this.updatePriceUpdateButton = updatePriceUpdateButton.bind(this);
        this.updateStopFollowButton = updateStopFollowButton.bind(this);
        this.setPendingPriceUpdate = setPendingPriceUpdate.bind(this);
        this.setPendingStopFollow = setPendingStopFollow.bind(this);
        this.onItemChangedTrackStatus = onItemChangedTrackStatus.bind(this);

        this.state = {
            recordButtonStatus: BUTTON_STATUS.inactive,
            autosaveButtonStatus: BUTTON_STATUS.inactive,
            priceUpdateButtonStatus: BUTTON_STATUS.inactive,
            stopFollowButtonStatus: BUTTON_STATUS.inactive
        };

        const onPopupStatus$ = this.triggerPopupStatus$();

        onPopupStatus$.pipe(
            switchMap(statuses => this.triggerAutoSaveStatus$(statuses))
        ).subscribe(this.updateAutosaveButton);

        onPopupStatus$.pipe(
            switchMap(statuses => this.triggerPriceUpdateStatus$(statuses))
        ).subscribe(this.updatePriceUpdateButton);

        onPopupStatus$.pipe(
            switchMap(statuses => this.triggerStopFollowStatus$(statuses))
        ).subscribe(this.updateStopFollowButton);
    }

    render() {
        return (
            <Fragment>
                <Toolbar recordButtonStatus={this.state.recordButtonStatus}
                         autosaveButtonStatus={this.state.autosaveButtonStatus}
                         priceUpdateButtonStatus={this.state.priceUpdateButtonStatus}
                         stopFollowButtonStatus={this.state.stopFollowButtonStatus}
                         onPopupStatus={this.onPopupStatus}
                         onItemChangedTrackStatus={this.onItemChangedTrackStatus}
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
        this.setPendingStopFollow();
    }

    triggerPopupStatus$() {
        return sendRuntimeMessage$({type: POPUP_STATUS}).pipe(
            tap(this.onPopupStatus),
            map(({state}) => ({
                autoSaveEnabled: state.autoSaveEnabled,
                isPriceUpdateEnabled: state.isPriceUpdateEnabled,
                isStopFollowEnabled: state.isStopFollowEnabled
            })),
            share()
        );
    }

    triggerAutoSaveStatus$({autoSaveEnabled}) {
        return of(autoSaveEnabled).pipe(
            filter(autoSaveEnabled => autoSaveEnabled),
            tap(this.setPendingAutosave),
            switchMap(() => queryActiveTab$()),
            switchMap(([{id}]) =>
                sendRuntimeMessage$({type: AUTO_SAVE_STATUS, payload: {id}})
            )
        );
    }

    triggerPriceUpdateStatus$({isPriceUpdateEnabled}) {
        return of(isPriceUpdateEnabled).pipe(
            switchMap(() => queryActiveTab$()),
            switchMap(([{id}]) =>
                sendRuntimeMessage$({type: PRICE_UPDATE_STATUS, payload: {id}})
            )
        );
    }

    triggerStopFollowStatus$({isStopFollowEnabled}) {
        return of(isStopFollowEnabled).pipe(
            switchMap(() => queryActiveTab$()),
            switchMap(([{id}]) =>
                sendRuntimeMessage$({type: STOP_FOLLOW_STATUS, payload: {id}})
            )
        );
    }
}

export default Popup;
