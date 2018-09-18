# price-tag

price-tag project consists in a chrome extension that allows online items price tracking/monitoring. When price changes user is alerted,
but there's a lot more, and more to come.

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
    * show diff percentage ✅
    * show current price vs target one ❗
    * improve item sorting ❗
        * by time ✅
        * by price ❗
        * by domain, time
        * by domain, price
    * minor styling ❗
 * periodical save in storage.sync: no conflicts resolution - simple version ❗`(wip)`
 * extension icon displaying page is being tracked
 * price tracking - part ii `(wip)` ❗
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
     * ~BUG: review async xhr pages (www.zara.com)~ ⚠️
     * show if item is being tracked ❗
     * use doc title as favicon title ✅
     * use doc title as item name ❗
     * allow naming item ❗
        * toggle on
 * keep tracked items object in state
 * saved money info (calc icon)
 * price alert setting
    * percentage threshold
    * value threshold
    * show amount intended to save (subject to target)
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
 
 **Legend:**
 * ❗️ urgent/priority development
 * ⚠️ unsolvable issue
 * ✅️ solved
 
 
 #### Temporary issues
 * `chrome.storage.local` while polling is shorter in development
 
 #### Incompatible websites (so far)
 * Zara - www.zara.com
