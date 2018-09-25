### CHANGELOG

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
