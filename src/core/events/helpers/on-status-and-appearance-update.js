import isEmpty from "lodash/isEmpty";
import {setDefaultAppearance, setTrackedItemAppearance} from "../appearance";
import StateManager from "../../state-manager";

function onStatusAndAppearanceUpdate(statusUpdate = []) {
    if (!isEmpty(statusUpdate)) {
        const [autoSaveUpdateStatus, priceUpdateStatus, enableTrackedItemAppearance] = statusUpdate;

        if (autoSaveUpdateStatus) {
            const {enable: enableAutoSave, selection} = autoSaveUpdateStatus;
            enableAutoSave ?
                StateManager.enableAutoSave(selection) :
                StateManager.disableAutoSave();
        }

        if (priceUpdateStatus) {
            const {enable: enablePriceUpdate, selection} = priceUpdateStatus;
            enablePriceUpdate ?
                StateManager.enablePriceUpdate(selection) :
                StateManager.disablePriceUpdate();
        }

        if (enableTrackedItemAppearance) {
            setTrackedItemAppearance();
            StateManager.enableCurrentPageTracked();
        } else {
            setDefaultAppearance();
            StateManager.disableCurrentPageTracked();
        }
    }
}

export default onStatusAndAppearanceUpdate;
