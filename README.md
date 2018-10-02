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
    * show current price vs target one ✅
    * improve item sorting ❗
        * by time ✅
        * by price ❗
        * by domain, time
        * by domain, price
    * back button always visible ❗
    * BUG: after delete all items doesnt display 'no tracked items' ❗
    * minor styling ❗
 * periodical save in storage.sync: no conflicts resolution - simple version ✅
 * extension icon and title displaying page is being tracked ✅
 * diff percentage - when (0 < diff < 1) round up; when (-1 < diff < 0) round down ✅
 * major improvement: use tab favicon url from onUpdate tab callback ✅
 * bug: auto-save disabled when opening extension while tab loads _(autosave check status callback error)_ ✅
 * bug: auto-save disabled & icon appearance to default when delete any item _(it should be disabled just if deleted url is the current one)_ ✅
 * when URL is very similar (probably same item) ✅
    * warn user and ask if wants to track ✅
        * activate in auto-save attempt ✅ 
        * activate in auto-save availability evaluation: in sites where path is enough to track ✅
        * activate on item record ✅
    * canonical usage ✅
 * tech debt: State needs to be immutable ✅
 * bug: duplicated content script *SPA's url update (www.amazon.es)* - insert declaratively in manifest ✅
 * extension icon displaying if storage is not sync-ed
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
     * allow price update if item is being tracked (visiting its page) ✅
     * use doc title as favicon title ✅
     * Refine usage: similar items warning - give option "Same item. Ask me later for items of this site" ❗❗
        _(Edge case Testing example: continente.pt) - When Product Id is a query parameter; save same Product after adding other irrelevant query parameters_   
        * choosing this option even though user says "it's the same item" don't use just path for this site future items ❗❗
        * for existing option "it's not the same item" say that if chose to he will be following - add "use only just path for items in this site" ✅
     * Refine usage: protect from sites that give canonical a wrong use - ask user which URL ✅
        * only use canonical if it's URL with path ✅
        * ask right before saving what user wants to do with that site: ✅
            "Use URL recommended by site. Remember this option", "Use recommended URL, just this time", "No, use my current URL instead. Remember this option"
     * BUG: extension appearance not updated when entering similar URL of domain whose path is enough to track ✅
     * tech debt: extension appearance update does complex logic when domain is not passed - no need, we always have the current domain ✅
     * BUG: if the URL changes and THERE IS NO canonical update then don't trust current canonical ✅
     * BUG: On full page refresh it doesn't seem to use canonical but it should - listen to tab full refresh ❗❗❗
     * BUG: After delete item highlights do not happen and cursor isn't pointer ❗❗
     * Allow HTML modal messages ❗
     * Error handling: Check storage.sync "QUOTA_BYTES_PER_ITEM quota exceeded" error ❗
     * add cancel button to similar item warning modal ❗
     * add button to stop following item in main toolbar ❗
     * use doc title as item name ❗
     * tech debt: record action doesn't deal with domain and url; state manages them ❗
     * allow naming item ❗
        * toggle on
     * show if item is being tracked in popup.js
 * save confirmation modal similar URLs message display as links
 * auto-save add highlight border
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
 * error handling: port disconnect
 * extension user tour
 * minor improvements to the ui (styling minor issues)
 * style ui (major) ❗
 * todos list in code
 * add project bundle build tool ❗
    * add yarn as package manager ❗
    * add rollup/webpack to build ❗
    * swap HandlebarsJS for React
 
 **Legend:**
 * ❗️ urgent/priority development
 * ⚠️ unsolvable issue
 * ✅️ solved
 
 
 #### Temporary issues
 * `chrome.storage.local` while polling is shorter in development
 
 #### Incompatible websites (so far)
 * Zara - www.zara.com
