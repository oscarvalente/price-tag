# price-tag

### Intended features / TODO

 * basic ui ✅
 * price tag selection ✅
    * Page viewport is focused on record click ✅
    * Record button keeps status color subject to highlight (de)activation ✅
    * add timestamp to tracked item object ✅
 * highlight current tab mouseover elements ✅
 * price tracking - part i ✅
    * check and update price changes ✅
 * price tag element saving (per web-app) - auto-save button ✅
    * enabled when item from same domain is already being tracked ✅
    * change auto-save button color ✅
    * price tracking element selection saving (same url pages) ✅
    * when enabled, highlight price element on hover (w/ same color) ✅
    * spa url change defaultCursor bug ✅
 * tracked items management panel `(wip)` ❗
    * basic ui ✅
    * delete ✅
    * execution manifest review ✅
    * watched/not_found & price increase items statuses (with matching icon) ✅
    * price increase/decrease status ✅
    * fix duplicated items (bug) + duplicated statuses + click price tag w/ href or event ✅
    * fix target selection (add more class) ✅
    * fix item sort ✅
    * refresh view while opened ✅
    * un-follow instead of delete (to keep background history) - remove watched status ✅
    * show favicon image next to item ✅
    * show current price vs target one ❗
    * show amount intended to save (subject to target) ❗
    * improve item sorting ❗
        * by time ✅
        * by price ❗
        * by domain, time
        * by domain, price
    * minor styling ❗
 * extension icon displaying page is being tracked
 * price tracking - part ii `(wip)` ❗❗❗❗
     * dismiss notifications ✅
        * lower price ✅
        * higher price ✅
        * price gone ✅
     * price increase alert
        * user review possibility (tune price increase) ✅
        * toggle off
     * BUG: auto-save after delete should not be disabled / sometimes doesn't work ✅
     * BUG: sometimes notifications State is lost ✅
     * stop following when price decreases (through notification) ✅
     * BUG: review async xhr pages (www.zara.com) ❗❗❗❗
     * show if item is being tracked ❗
     * use doc title as favicon title ✅
     * use doc title as item name ❗
 * keep tracked items object in state
 * saved money info (calc icon)
 * price alert setting
    * percentage threshold
    * value threshold
    * has threshold defined status
    * price decrease status but not yet reach threshold (and icon)
 * auto-save animation
 * price tracking suggestion
    * intelligent price detection
    * extension icon displaying page has prices (change extension style)
    * price tracking suggestion preference toggling
 * price history graph
    * migrate persisted state to IndexedDB ❕
    * graph button on management panel
    * new view
 * extension user tour
 * minor improvements to the ui (styling minor issues)
 * style ui (major) ❗
 * todos list in code
 * add project bundle build tool
