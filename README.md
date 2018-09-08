# price-tag

### Intended features / TODO

 * basic ui `(wip)`
 * price tag selection ✅
    * Page viewport is focused on record click ✅
    * Record button keeps status color subject to highlight (de)activation ✅
    * add timestamp to tracked item object ✅
 * highlight current tab mouseover elements ✅
 * price tracking ✅
    * stop following when price decreases (notification)
    * price increase alert
        * user review possibility
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
    * watched/not_found & price increase items statuses (with matching icon) ❗
 * extension icon displaying page is being tracked
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
