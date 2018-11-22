- // TODO: 1. Since popup is destroyed we need to return anything after we display the popup !!!! otherwise the modal flow stream down
    - //  - we need to see if a modal showed up
    - //  - if yes: then it doesn't matter what we return (can be false) because the popup will be dismissed
    - //  - if not: we need to wait on the save result
- // TODO: 2. If a port disconnect error appears we still wish to proceed and not throw error in the stream, whichever it is
but there isn't update in extensions appearance, so error is stopping the update
// TODO: 3. doesn't stop highlight the element on AUTO_SAVE.ATTEMPT
