# Duplicate Tab Closer

This is a chrome extension that will close any tabs with the exact same urls.
It has many configurable options in which you can decide whether to close tabs based on if they are in a different window, a different tab group, or through a list of exclusions that you define (which does support regex).

---

## Installation
**note**: You must use node version `<= 16.13.0`. Otherwise you will encounter an error about `error:0308010C:digital envelope routines::unsupported`.
To change your node version, check out [nvm](https://github.com/nvm-sh/nvm).


1. Clone this repo `git clone https://github.com/AngeloKandah/DuplicateTabCloser.git` into a folder of your choice.
2. Make sure you are in that folder in your cli.
2. Install Dependencies `npm install`.
3. Build the project `npm run build`.
4. After this is installed, you will produce a /dist folder.
5. Then go to chrome://extensions/ and click `load unpacked` and point it to that dist folder.

---

## Options
There are three options: moveTabs, effectTabGroups, effectWindows.
There is also exclusions, which the user creates a list of so the extension knows to ignore urls that return true for the exclusion.

### Move Tabs

This option will move the already opened tab to where you attempted to open the new tab. Also, if the tab were to be opened from a current tab (via middle mouse button or external link) it will move the already opened tab to be in front of tab that called to open the link.

### Detect Duplicates Between Windows

This option will detect duplicate tabs across all windows. So if a tab with the same url is open in a different instance of chrome, it will detect it and close it and focus that tab in the other window.

### Detect Duplicates Between Tab Groups

This option will detect duplicates across all tab groups, basically ignoring any tab groups from having the same tabs in them. If this option is not checked, you can have the same tab open in every tab group, however once a duplicate is detected within the tab group it will close it.

### Exclusions

The exclusions allows for the user to be able to decide what they want the extension to ignore. The exclusions supports regex so you can have specific exclusions and the tabs that meet the criteria will be ignored from being closed if a duplicate is detected.
