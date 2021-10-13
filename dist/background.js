/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background.js":
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
/***/ ((module) => {

function initExtension() {
    removeAllDuplicates();
}

async function getOptions() {
    const { options } = await getLocalStorageKey('options');
    if (!options) {
        const defaultOptions = {
            moveTabs: true,
            effectWindows: false,
            effectTabGroups: false,
            exclusions: [],
        };
        setLocalStorageValue({ options: defaultOptions });
        return defaultOptions;
    }
    return options;
}

async function removeAllDuplicates() {
    const tabs = await chrome.tabs.query({});
    const tabsWithoutDups = [];
    tabs.forEach(async (tab) => {
        const hasDupes = await hasDuplicates(tab);
        tabsWithoutDups.includes(tab.url) && hasDupes
            ? closeChromeTab(tab.id)
            : tabsWithoutDups.push(tab.url);
    });
}

function constructUrl(url) {
    const hashlessURL = new URL(url);
    hashlessURL.hash = '';
    return hashlessURL.toString();
}

const hasDuplicates = async (tabInfo) => {
    const {
        id: tabId,
        url: tabUrl,
        windowId: tabWinId,
        groupId: tabGroupId,
    } = tabInfo;
    const { effectTabGroups, effectWindows } = await getOptions();
    const queriedTabs = await chrome.tabs.query({ url: constructUrl(tabUrl) });
    const excluded = await isExcluded(tabUrl);
    return queriedTabs.reduce((acc, { url, id, windowId, groupId }) => {
        return (
            acc ||
            (url === tabUrl &&
                id !== tabId &&
                windowId === (effectWindows ? windowId : tabWinId) &&
                groupId === (effectTabGroups ? groupId : tabGroupId) &&
                !excluded)
        );
    }, false);
};

async function isExcluded(tabUrl) {
    const { exclusions } = await getOptions();
    return exclusions.some((exclusion) => {
        const regexedExclusion = new RegExp(exclusion);
        return regexedExclusion.test(tabUrl);
    });
}

async function getTabId(tabUrl, tabWinId, tabGroupId) {
    const queryParams = { url: constructUrl(tabUrl) };
    const { effectWindows } = await getOptions();
    if (!effectWindows) {
        queryParams['windowId'] = tabWinId;
        queryParams['groupId'] = tabGroupId;
    }
    const [{ id: tabId }] = await chrome.tabs.query(queryParams);
    return tabId;
}

function closeChromeTab(tabId) {
    chrome.tabs.remove(tabId);
}

function changeChromeTabFocus(tabId) {
    chrome.tabs.update(tabId, { active: true });
}

//Add (effectWindows, move tab to current window, and maintain position)
async function moveChromeTab(tabPosition, tabId) {
    const { index: position } = await chrome.tabs.get(tabId);
    tabPosition + 1 > position
        ? chrome.tabs.move(tabId, { index: tabPosition })
        : chrome.tabs.move(tabId, { index: tabPosition + 1 });
}

async function getTabPosition(tabId) {
    const { index: tabPosition } = await chrome.tabs.get(tabId);
    return tabPosition;
}

async function onUpdate(
    tabId,
    { url: loading, status },
    { url, openerTabId, windowId, groupId }
) {
    if (loading || status === 'unloaded') return;
    const tabInfo = { id: tabId, url, windowId, groupId };
    const duplicateCheck = await hasDuplicates(tabInfo);
    if (duplicateCheck) {
        closeChromeTab(tabId);
        const alreadyOpenedTabId = await getTabId(url, windowId, groupId);
        changeChromeTabFocus(alreadyOpenedTabId);
        const { moveTabs } = await getOptions();
        if (openerTabId && moveTabs) {
            const tabPosition = await getTabPosition(openerTabId);
            await moveChromeTab(tabPosition, alreadyOpenedTabId);
        }
    }
}

/**
 * Read from local storage in async instead of using callbacks
 * Pass in a single string key or an array of keys to retrieve multiple values
 *
 * @param {string|array<string>} key
 * @returns {object}
 */
const getLocalStorageKey = (key) => {
    let storageKey = key;
    if (typeof storageKey !== 'array') storageKey = [storageKey];

    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(storageKey, resolve);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Set an object in local storage to the given value
 * Local Stoarge objects key is based on the Object key passed in
 * @param {Object} val
 */
const setLocalStorageValue = (val) => chrome.storage.local.set(val);

chrome.storage.onChanged.addListener(getOptions);

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

chrome.tabs.onUpdated.addListener(onUpdate);

module.exports = {
    constructUrl,
    hasDuplicates,
    getOptions,
    isExcluded,
    getLocalStorageKey,
    getTabPosition,
}; //Must be commented out to import for extension use


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/background.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxVQUFVO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLHlCQUF5QjtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ04sWUFBWSxpQ0FBaUM7QUFDN0Msa0RBQWtELDJCQUEyQjtBQUM3RTtBQUNBLHNDQUFzQyw0QkFBNEI7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxZQUFZLGFBQWE7QUFDekI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQjtBQUMxQixZQUFZLGdCQUFnQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsV0FBVztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLGNBQWM7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLGtCQUFrQjtBQUM5QjtBQUNBLG9DQUFvQyxvQkFBb0I7QUFDeEQsb0NBQW9DLHdCQUF3QjtBQUM1RDtBQUNBO0FBQ0E7QUFDQSxZQUFZLHFCQUFxQjtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTSxzQkFBc0I7QUFDNUIsTUFBTTtBQUNOO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixXQUFXO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLHNCQUFzQjtBQUNqQyxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7Ozs7OztVQ2hLSDtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VFdEJBO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZ2V0dGluZy1zdGFydGVkLy4vc3JjL2JhY2tncm91bmQuanMiLCJ3ZWJwYWNrOi8vZ2V0dGluZy1zdGFydGVkL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2dldHRpbmctc3RhcnRlZC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2dldHRpbmctc3RhcnRlZC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vZ2V0dGluZy1zdGFydGVkL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbml0RXh0ZW5zaW9uKCkge1xyXG4gICAgcmVtb3ZlQWxsRHVwbGljYXRlcygpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRPcHRpb25zKCkge1xyXG4gICAgY29uc3QgeyBvcHRpb25zIH0gPSBhd2FpdCBnZXRMb2NhbFN0b3JhZ2VLZXkoJ29wdGlvbnMnKTtcclxuICAgIGlmICghb3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBtb3ZlVGFiczogdHJ1ZSxcclxuICAgICAgICAgICAgZWZmZWN0V2luZG93czogZmFsc2UsXHJcbiAgICAgICAgICAgIGVmZmVjdFRhYkdyb3VwczogZmFsc2UsXHJcbiAgICAgICAgICAgIGV4Y2x1c2lvbnM6IFtdLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgc2V0TG9jYWxTdG9yYWdlVmFsdWUoeyBvcHRpb25zOiBkZWZhdWx0T3B0aW9ucyB9KTtcclxuICAgICAgICByZXR1cm4gZGVmYXVsdE9wdGlvbnM7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb3B0aW9ucztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVtb3ZlQWxsRHVwbGljYXRlcygpIHtcclxuICAgIGNvbnN0IHRhYnMgPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeSh7fSk7XHJcbiAgICBjb25zdCB0YWJzV2l0aG91dER1cHMgPSBbXTtcclxuICAgIHRhYnMuZm9yRWFjaChhc3luYyAodGFiKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaGFzRHVwZXMgPSBhd2FpdCBoYXNEdXBsaWNhdGVzKHRhYik7XHJcbiAgICAgICAgdGFic1dpdGhvdXREdXBzLmluY2x1ZGVzKHRhYi51cmwpICYmIGhhc0R1cGVzXHJcbiAgICAgICAgICAgID8gY2xvc2VDaHJvbWVUYWIodGFiLmlkKVxyXG4gICAgICAgICAgICA6IHRhYnNXaXRob3V0RHVwcy5wdXNoKHRhYi51cmwpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbnN0cnVjdFVybCh1cmwpIHtcclxuICAgIGNvbnN0IGhhc2hsZXNzVVJMID0gbmV3IFVSTCh1cmwpO1xyXG4gICAgaGFzaGxlc3NVUkwuaGFzaCA9ICcnO1xyXG4gICAgcmV0dXJuIGhhc2hsZXNzVVJMLnRvU3RyaW5nKCk7XHJcbn1cclxuXHJcbmNvbnN0IGhhc0R1cGxpY2F0ZXMgPSBhc3luYyAodGFiSW5mbykgPT4ge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIGlkOiB0YWJJZCxcclxuICAgICAgICB1cmw6IHRhYlVybCxcclxuICAgICAgICB3aW5kb3dJZDogdGFiV2luSWQsXHJcbiAgICAgICAgZ3JvdXBJZDogdGFiR3JvdXBJZCxcclxuICAgIH0gPSB0YWJJbmZvO1xyXG4gICAgY29uc3QgeyBlZmZlY3RUYWJHcm91cHMsIGVmZmVjdFdpbmRvd3MgfSA9IGF3YWl0IGdldE9wdGlvbnMoKTtcclxuICAgIGNvbnN0IHF1ZXJpZWRUYWJzID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoeyB1cmw6IGNvbnN0cnVjdFVybCh0YWJVcmwpIH0pO1xyXG4gICAgY29uc3QgZXhjbHVkZWQgPSBhd2FpdCBpc0V4Y2x1ZGVkKHRhYlVybCk7XHJcbiAgICByZXR1cm4gcXVlcmllZFRhYnMucmVkdWNlKChhY2MsIHsgdXJsLCBpZCwgd2luZG93SWQsIGdyb3VwSWQgfSkgPT4ge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIGFjYyB8fFxyXG4gICAgICAgICAgICAodXJsID09PSB0YWJVcmwgJiZcclxuICAgICAgICAgICAgICAgIGlkICE9PSB0YWJJZCAmJlxyXG4gICAgICAgICAgICAgICAgd2luZG93SWQgPT09IChlZmZlY3RXaW5kb3dzID8gd2luZG93SWQgOiB0YWJXaW5JZCkgJiZcclxuICAgICAgICAgICAgICAgIGdyb3VwSWQgPT09IChlZmZlY3RUYWJHcm91cHMgPyBncm91cElkIDogdGFiR3JvdXBJZCkgJiZcclxuICAgICAgICAgICAgICAgICFleGNsdWRlZClcclxuICAgICAgICApO1xyXG4gICAgfSwgZmFsc2UpO1xyXG59O1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gaXNFeGNsdWRlZCh0YWJVcmwpIHtcclxuICAgIGNvbnN0IHsgZXhjbHVzaW9ucyB9ID0gYXdhaXQgZ2V0T3B0aW9ucygpO1xyXG4gICAgcmV0dXJuIGV4Y2x1c2lvbnMuc29tZSgoZXhjbHVzaW9uKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVnZXhlZEV4Y2x1c2lvbiA9IG5ldyBSZWdFeHAoZXhjbHVzaW9uKTtcclxuICAgICAgICByZXR1cm4gcmVnZXhlZEV4Y2x1c2lvbi50ZXN0KHRhYlVybCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0VGFiSWQodGFiVXJsLCB0YWJXaW5JZCwgdGFiR3JvdXBJZCkge1xyXG4gICAgY29uc3QgcXVlcnlQYXJhbXMgPSB7IHVybDogY29uc3RydWN0VXJsKHRhYlVybCkgfTtcclxuICAgIGNvbnN0IHsgZWZmZWN0V2luZG93cyB9ID0gYXdhaXQgZ2V0T3B0aW9ucygpO1xyXG4gICAgaWYgKCFlZmZlY3RXaW5kb3dzKSB7XHJcbiAgICAgICAgcXVlcnlQYXJhbXNbJ3dpbmRvd0lkJ10gPSB0YWJXaW5JZDtcclxuICAgICAgICBxdWVyeVBhcmFtc1snZ3JvdXBJZCddID0gdGFiR3JvdXBJZDtcclxuICAgIH1cclxuICAgIGNvbnN0IFt7IGlkOiB0YWJJZCB9XSA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHF1ZXJ5UGFyYW1zKTtcclxuICAgIHJldHVybiB0YWJJZDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xvc2VDaHJvbWVUYWIodGFiSWQpIHtcclxuICAgIGNocm9tZS50YWJzLnJlbW92ZSh0YWJJZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoYW5nZUNocm9tZVRhYkZvY3VzKHRhYklkKSB7XHJcbiAgICBjaHJvbWUudGFicy51cGRhdGUodGFiSWQsIHsgYWN0aXZlOiB0cnVlIH0pO1xyXG59XHJcblxyXG4vL0FkZCAoZWZmZWN0V2luZG93cywgbW92ZSB0YWIgdG8gY3VycmVudCB3aW5kb3csIGFuZCBtYWludGFpbiBwb3NpdGlvbilcclxuYXN5bmMgZnVuY3Rpb24gbW92ZUNocm9tZVRhYih0YWJQb3NpdGlvbiwgdGFiSWQpIHtcclxuICAgIGNvbnN0IHsgaW5kZXg6IHBvc2l0aW9uIH0gPSBhd2FpdCBjaHJvbWUudGFicy5nZXQodGFiSWQpO1xyXG4gICAgdGFiUG9zaXRpb24gKyAxID4gcG9zaXRpb25cclxuICAgICAgICA/IGNocm9tZS50YWJzLm1vdmUodGFiSWQsIHsgaW5kZXg6IHRhYlBvc2l0aW9uIH0pXHJcbiAgICAgICAgOiBjaHJvbWUudGFicy5tb3ZlKHRhYklkLCB7IGluZGV4OiB0YWJQb3NpdGlvbiArIDEgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldFRhYlBvc2l0aW9uKHRhYklkKSB7XHJcbiAgICBjb25zdCB7IGluZGV4OiB0YWJQb3NpdGlvbiB9ID0gYXdhaXQgY2hyb21lLnRhYnMuZ2V0KHRhYklkKTtcclxuICAgIHJldHVybiB0YWJQb3NpdGlvbjtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25VcGRhdGUoXHJcbiAgICB0YWJJZCxcclxuICAgIHsgdXJsOiBsb2FkaW5nLCBzdGF0dXMgfSxcclxuICAgIHsgdXJsLCBvcGVuZXJUYWJJZCwgd2luZG93SWQsIGdyb3VwSWQgfVxyXG4pIHtcclxuICAgIGlmIChsb2FkaW5nIHx8IHN0YXR1cyA9PT0gJ3VubG9hZGVkJykgcmV0dXJuO1xyXG4gICAgY29uc3QgdGFiSW5mbyA9IHsgaWQ6IHRhYklkLCB1cmwsIHdpbmRvd0lkLCBncm91cElkIH07XHJcbiAgICBjb25zdCBkdXBsaWNhdGVDaGVjayA9IGF3YWl0IGhhc0R1cGxpY2F0ZXModGFiSW5mbyk7XHJcbiAgICBpZiAoZHVwbGljYXRlQ2hlY2spIHtcclxuICAgICAgICBjbG9zZUNocm9tZVRhYih0YWJJZCk7XHJcbiAgICAgICAgY29uc3QgYWxyZWFkeU9wZW5lZFRhYklkID0gYXdhaXQgZ2V0VGFiSWQodXJsLCB3aW5kb3dJZCwgZ3JvdXBJZCk7XHJcbiAgICAgICAgY2hhbmdlQ2hyb21lVGFiRm9jdXMoYWxyZWFkeU9wZW5lZFRhYklkKTtcclxuICAgICAgICBjb25zdCB7IG1vdmVUYWJzIH0gPSBhd2FpdCBnZXRPcHRpb25zKCk7XHJcbiAgICAgICAgaWYgKG9wZW5lclRhYklkICYmIG1vdmVUYWJzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhYlBvc2l0aW9uID0gYXdhaXQgZ2V0VGFiUG9zaXRpb24ob3BlbmVyVGFiSWQpO1xyXG4gICAgICAgICAgICBhd2FpdCBtb3ZlQ2hyb21lVGFiKHRhYlBvc2l0aW9uLCBhbHJlYWR5T3BlbmVkVGFiSWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlYWQgZnJvbSBsb2NhbCBzdG9yYWdlIGluIGFzeW5jIGluc3RlYWQgb2YgdXNpbmcgY2FsbGJhY2tzXHJcbiAqIFBhc3MgaW4gYSBzaW5nbGUgc3RyaW5nIGtleSBvciBhbiBhcnJheSBvZiBrZXlzIHRvIHJldHJpZXZlIG11bHRpcGxlIHZhbHVlc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ3xhcnJheTxzdHJpbmc+fSBrZXlcclxuICogQHJldHVybnMge29iamVjdH1cclxuICovXHJcbmNvbnN0IGdldExvY2FsU3RvcmFnZUtleSA9IChrZXkpID0+IHtcclxuICAgIGxldCBzdG9yYWdlS2V5ID0ga2V5O1xyXG4gICAgaWYgKHR5cGVvZiBzdG9yYWdlS2V5ICE9PSAnYXJyYXknKSBzdG9yYWdlS2V5ID0gW3N0b3JhZ2VLZXldO1xyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KHN0b3JhZ2VLZXksIHJlc29sdmUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgYW4gb2JqZWN0IGluIGxvY2FsIHN0b3JhZ2UgdG8gdGhlIGdpdmVuIHZhbHVlXHJcbiAqIExvY2FsIFN0b2FyZ2Ugb2JqZWN0cyBrZXkgaXMgYmFzZWQgb24gdGhlIE9iamVjdCBrZXkgcGFzc2VkIGluXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWxcclxuICovXHJcbmNvbnN0IHNldExvY2FsU3RvcmFnZVZhbHVlID0gKHZhbCkgPT4gY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHZhbCk7XHJcblxyXG5jaHJvbWUuc3RvcmFnZS5vbkNoYW5nZWQuYWRkTGlzdGVuZXIoZ2V0T3B0aW9ucyk7XHJcblxyXG5jaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihpbml0RXh0ZW5zaW9uKTtcclxuXHJcbmNocm9tZS5ydW50aW1lLm9uU3RhcnR1cC5hZGRMaXN0ZW5lcihpbml0RXh0ZW5zaW9uKTtcclxuXHJcbmNocm9tZS50YWJzLm9uVXBkYXRlZC5hZGRMaXN0ZW5lcihvblVwZGF0ZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNvbnN0cnVjdFVybCxcclxuICAgIGhhc0R1cGxpY2F0ZXMsXHJcbiAgICBnZXRPcHRpb25zLFxyXG4gICAgaXNFeGNsdWRlZCxcclxuICAgIGdldExvY2FsU3RvcmFnZUtleSxcclxuICAgIGdldFRhYlBvc2l0aW9uLFxyXG59OyAvL011c3QgYmUgY29tbWVudGVkIG91dCB0byBpbXBvcnQgZm9yIGV4dGVuc2lvbiB1c2VcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2JhY2tncm91bmQuanNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=