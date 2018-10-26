function addUndoRemovedItem(state, url, {timestamp}, maxItems) {
    const itemRef = {url, timestamp};
    const _undoRemovedItemsClone = [...state._undoRemovedItems];
    _undoRemovedItemsClone.unshift(itemRef);
    const _undoRemovedItems = _undoRemovedItemsClone.slice(0, maxItems);

    return {
        ...state,
        _undoRemovedItems
    };
}

function getUndoRemovedItemsHead(state) {
    return state._undoRemovedItems[0];
}

function removeUndoRemovedItem(state) {
    const _undoRemovedItems = [...state._undoRemovedItems];
    _undoRemovedItems.shift();

    return {
        ...state,
        _undoRemovedItems
    };
}

function resetUndoRemovedItems(state) {
    return {
        ...state,
        _undoRemovedItems: []
    };
}

function setUndoRemovedItemsResetTask(state, task) {
    return {
        ...state,
        _undoRemovedItemsResetTask: task
    };
}

export {
    addUndoRemovedItem,
    getUndoRemovedItemsHead,
    removeUndoRemovedItem,
    resetUndoRemovedItems,
    setUndoRemovedItemsResetTask
};
