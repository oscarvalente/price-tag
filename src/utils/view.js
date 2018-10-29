function buildSaveConfirmationPayload(currentURL, similarURL) {
    return {
        title: "Item with similar URL to existing one",
        message: "It appears that the item URL you're trying to save:<br>" +
            `<i><a href="${currentURL}" target="_blank" rel="noopener noreferrer">${currentURL}</a></i><br>` +
            "is pretty similar to<br>" +
            `<i><a href="${similarURL}" target="_blank" rel="noopener noreferrer">${similarURL}</a></i><br><br>` +
            "Since your choice will affect the way items are tracked in this site futurely,<br>please help us helping you by choosing carefully one of the following options:",
        buttons: [
            "It's not, save it! Remember this option for this site.",
            "Don't save. Ask me again for items of this site!",
            "Indeed the same item. Don't save! Remember this option for this site. (Use just URL path for accessing items)",
            "For now save this item. Ask me again next time!"
        ]
    };
}

function buildURLConfirmationPayload(canonicalURL, browserURL, domain) {
    return {
        title: "This website recommends to follow this item through a different URL",
        message: `<u>${domain}</u> says that a more accurate URL for this item would be:<br>` +
            `<i><a href="${canonicalURL}" target="_blank"  rel="noopener noreferrer">${canonicalURL}</a></i><br>` +
            "If this is correct, we recommend you to follow it.<br><br>" +
            "<b>However</b> you can still opt to choose following the current browser URL:<br>" +
            `<i><a href="${browserURL}" target="_blank" rel="noopener noreferrer">${browserURL}</a></i><br><br>` +
            "Since your choice will affect the way items are tracked in this site futurely,<br>please help us helping you by choosing carefully one of the following options:",
        buttons: [
            "Use recommended URL. Remember this option for this site",
            "Use recommended URL but just this time",
            "It's not correct, use the current browser URL. Remember this option",
            "Don't use recommended URL. Use the current browser URL instead but just this time"
        ]
    };
}

export {
    buildSaveConfirmationPayload,
    buildURLConfirmationPayload
};
