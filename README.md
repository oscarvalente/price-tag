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
 * tracked items management panel `(wip)`
    * basic ui ✅
    * delete ✅
    * execution manifest review ✅
    * watched/not_found & price increase items statuses (with matching icon) ✅
    * price increase/decrease status ✅
    * fix duplicated items (bug) + duplicated statuses + click price tag w/ href or event ✅
    * fix target selection (add more class) ✅
    * fix item sort ✅
    * improve item sorting ❗
        * by time ✅
        * by price ❗
        * by domain, time
        * by domain, price
    * un-follow instead of delete (to keep background history) - unwatched status ❗
    * minor styling ❗
 * extension icon displaying page is being tracked
 * price tracking - part ii
     * dismiss notifications ❗
        * lower price ✅
        * higher price ❗
     * price increase alert ❗
        * user review possibility
     * stop following when price decreases (through notification) ❗
     * Allow naming item ❗
 * keep tracked items object in state
 * saved money info (calc icon)
 * price tracking suggestion
    * intelligent price detection
    * extension icon displaying page has prices (change extension style)
    * price tracking suggestion preference toggling
 * price history graph
    * migrate persisted state to IndexedDB ❕
    * graph button on management panel
    * new view
 * price alert setting
    * percentage threshold
    * value threshold
    * has threshold defined status
    * price decrease status but not yet reach threshold (and icon)
 * extension user tour
 * minor improvements to the ui (styling minor issues)
 * style ui (major)
 * todos list in code
 * add project bundle build tool
