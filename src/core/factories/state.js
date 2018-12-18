class StateFactory {
    static createState(sortItemByType) {
        return {
            recordActive: false,
            notifications: {},
            notificationsCounter: 0,
            autoSaveEnabled: false,
            isPriceUpdateEnabled: false,
            selection: null,
            isSimilarElementHighlighted: false,
            originalBackgroundColor: null,
            isCurrentPageTracked: false,
            faviconURL: null,
            _faviconURLMap: {},
            currentURL: null,
            canonicalURL: null,
            browserURL: null,
            domain: null,
            _sortItemsBy: sortItemByType,
            _undoRemovedItems: [],
            _undoRemovedItemsResetTask: null
        };
    }

    static toggleRecord(state) {
        return {
            ...state,
            recordActive: !state.recordActive
        }
    }

    static disableRecord(state) {
        return {
            ...state,
            recordActive: false
        }
    }

    static updateCurrentDomain(state, domain) {
        return {
            ...state,
            domain
        };
    }

    static updateCurrentURL(state, currentURL) {
        return {
            ...state,
            currentURL
        };
    }

    static updateCanonicalURL(state, canonicalURL) {
        return {
            ...state,
            canonicalURL
        };
    }

    static updateBrowserURL(state, browserURL) {
        return {
            ...state,
            browserURL
        };
    }

    static enableCurrentPageTracked(state) {
        return {
            ...state,
            isCurrentPageTracked: true
        };
    }

    static disableCurrentPageTracked(state) {
        return {
            ...state,
            isCurrentPageTracked: false
        };
    }

    static updateFaviconURL(state, faviconURL) {
        return {
            ...state,
            faviconURL
        };
    }

    static updateFaviconURLMapItem(state, tabId, faviconURL) {
        return {
            ...state,
            _faviconURLMap: {
                ...state._faviconURLMap,
                [tabId]: faviconURL
            }
        };
    }

    static enableAutoSave(state, selection) {
        selection = selection || state.selection;
        return {
            ...state,
            autoSaveEnabled: true,
            selection
        };
    }

    static disableAutoSave(state) {
        return {
            ...state,
            autoSaveEnabled: false
        };
    }

    static enablePriceUpdate(state, selection) {
        return {
            ...state,
            isPriceUpdateEnabled: true,
            selection
        };
    }

    static disablePriceUpdate(state) {
        return {
            ...state,
            isPriceUpdateEnabled: false
        };
    }

    static setSelectionInfo(state, selection, price, faviconURL, faviconAlt) {
        return {
            ...state,
            selection,
            price,
            faviconURL,
            faviconAlt
        };
    }

    static setSimilarElementHighlight(state, isSimilarElementHighlighted, originalBackgroundColor) {
        return {
            ...state,
            isSimilarElementHighlighted,
            originalBackgroundColor
        };
    }

    static incrementNotificationsCounter(state) {
        const notificationsCounter = state.notificationsCounter + 1;
        return {
            ...state,
            notificationsCounter
        }
    }

    static deleteNotificationsItem(state, notificationId) {
        const newState = {...state};
        delete newState.notifications[notificationId];
        return newState;
    }

    static updateNotificationsItem(state, notificationId, notificationState) {
        return {
            ...state,
            notifications: {
                ...state.notifications,
                [notificationId]: notificationState
            }
        };
    }

    static updateSortItemsBy(state, _sortItemsBy) {
        return {
            ...state,
            _sortItemsBy
        };
    }

    static addUndoRemovedItem(state, url, {timestamp}, maxItems) {
        const itemRef = {url, timestamp};
        const _undoRemovedItemsClone = [...state._undoRemovedItems];
        _undoRemovedItemsClone.unshift(itemRef);
        const _undoRemovedItems = _undoRemovedItemsClone.slice(0, maxItems);

        return {
            ...state,
            _undoRemovedItems
        };
    }

    static getUndoRemovedItemsHead(state) {
        return state._undoRemovedItems[0];
    }

    static removeUndoRemovedItem(state) {
        const _undoRemovedItems = [...state._undoRemovedItems];
        _undoRemovedItems.shift();

        return {
            ...state,
            _undoRemovedItems
        };
    }

    static removeUndoRemovedItemByURL(state, url) {
        const _undoRemovedItems = [...state._undoRemovedItems]
            .filter(({url: itemURL}) => itemURL !== url);

        return {
            ...state,
            _undoRemovedItems
        };
    }

    static resetUndoRemovedItems(state) {
        return {
            ...state,
            _undoRemovedItems: []
        };
    }

    static setUndoRemovedItemsResetTask(state, task) {
        return {
            ...state,
            _undoRemovedItemsResetTask: task
        };
    }
}

export default StateFactory;
