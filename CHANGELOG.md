### CHANGELOG

#0.21.0
* Add cancel button to modal and apply to 2 existing modals

#0.20.1
* Migrate "No tracked items" in tracked items panel (forgotten)

# v0.20.0
* Undo removed items (up to 10 in a bulk)
* Eslint all the app and fixes
* React-related code fixes

# v0.19.2
* Minor styling to sort by picker

# v0.19.1
* Rel noopener on modal links

# v0.19.0
* Sort tracked items by time asc/price asc 

# v0.18.19
* Bug fix: also use full URL to check if item is bring tracked

# v0.18.18
* Migrate modal to react

# v0.18.17
* eslint in build

# v0.18.16
* Migrate track list panel to React

# v0.18.15
* Migrate main popup to React

# v0.18.14
* Open modal links on blank target

# v0.18.13
* Remove dependency from rollup copy files plugin
* Bundle modal.js

# v0.18.12
* Dev build is top folder local, Prod build is dist - re-structure build accordingly

# v0.18.11
* Copy needed assets to generate full-fledged independent dist

# v0.18.10
* Add build environment and scripts improvement

# v0.18.9
* Yarn as package-manager
* Rollup as build tool

# v0.18.8
* Allow HTML inside modal messages

# v0.18.7
* Fix diff percentage update on price update successful attempt

# v0.18.6
* Add "Use browser URL just this time" option
* Fix saving item for unexisting domain bug

# v0.18.5
* No tracked items label gone after delete all items bug fix

# v0.18.4
* Back button always visible

# v0.18.3
* Document bug and track toolbar layout improvements 

# v0.18.2
* Remove unused function

# v0.18.1
* Always fetch canonical separately to prevent bug

# v0.18.0
* Add button not to save item and ask later again

# v0.17.4
* Refine message when displaying button message that toggles path is enough
* Minor styling in modal buttons
* Update README.md with new tab full refresh bug

# v0.17.3
* Use canonical only if applicable and if user navigated to a different page

# v0.17.2
* Update current URL if canonical usage can't be applied and if current path is enough to track the item in current website

# v0.17.1
* Improve extension appearance status calculation based on the domain

# v0.17.0
* Give the option to confirm if canonical is of good use or not

# v0.16.1
* Canonical must be a URL with path to be used

# v0.16.0
* When user visits a tracked item page, allow price update when there are changes compared to the saved price-tag

# v0.15.3
* Fix canonical feature merge to master

# v0.15.2
* Turn State function changes are immutable

# v0.15.1
* Use canonical as primary URL

# v0.15.0
* Warn mechanism about possible same item save attempt

# v0.14.5
* Inject content script declaratively instead of on tab update 

# v0.14.4
* Minor styling in tracking toolbar

# v0.14.3
* Inject content script once ("loading" active tab)

# v0.14.2
* Use on tab update smart favicon URL provided by chrome as primary favicon URL

# v0.14.1
* Round to relevant percentage when difference is near 0%

# v0.14.0
* Icon and title change on pages that are being tracked
* on tab update performance improvement
* Update README.md with spotted issues

# v0.13.1
* Fix element path selector, needed trim
* Once not found always never found bug fix

# v0.13.0
* Display not highlighted target price

# v0.12.0
* Periodical synching between storage.sync and storage.local (2 in 2min)
* Improve domain match regex

# v0.11.0
* Save/waste percentage in track panel

# v0.10.3
* Fix _v0.10.2_ mentioned bug and use storage.sync again

# v0.10.2
* Use storage.local: for the time being extension has bugs using storage.sync

# v0.10.1
* Change not found hover info
* Not ready document investigated (see unsolvable issues)

# v0.10.0
* Track panel - item title in favicon hover
* Price not found notification dismiss

# v0.9.0
* Track panel - favicon next to item

# v0.8.2
* Auto-save - open extension during page refresh

# v0.8.1
* Notifications state reset bug

# v0.8.0
* Stop following option (either higher or lower price alerts)
* Track management panel - periodic refresh 

# v0.7.0
* Higher price follow (humble price follow)
* Higher price dismiss

# v0.6.1
* Fix item sorting by time

# v0.6.0
* Starting price comparison
* Dismiss lower price notification
* Lower pricer - update and track lower price

# v0.5.1
* Fix duplicated items bugs
* Fix duplicated statuses
* Stop propagation prevent default click price tag w/ href or event
* Fix target selection (for sites w/ identical elements selections)

# v0.5.0
* Higher/lower price status display

# v0.4.1
* Selection bugfixes

# v0.4.0
* Items status persistence
* Items status display

# v0.3.0
* Management panel
    * Access items
    * Delete items
    * Basic navigation

# v0.2.0
* Auto-save feature
* Highlight target element on mouse over

# v0.0.1
* Record element button
* Price tracking notifications (not found, fix and decrease)
