let options = {};
const defaultOptions = {
    moveTabs: true,
    effectWindows: false,
    effectTabGroups: false,
    exclusions: [],
}

async function initExtension() {
    getOptions();
    removeAllDuplicates();
}

async function getOptions() {
    const { options } = await getLocalStorageKey('options');
    if (!options) {
        setLocalStorageValue({ options: defaultOptions });
    }
    this.options = options || defaultOptions;
}

async function removeAllDuplicates() {
    const tabs = await chrome.tabs.query({});
    const tabsWithoutDups = [];
    for (const { id, url, windowId, groupId } of tabs) {
        tabsWithoutDups.includes(url) &&
            (await hasDuplicates(id, url, windowId, groupId))
            ? closeChromeTab(id)
            : tabsWithoutDups.push(url);
    }
}

function constructUrl(url) {
    const hashlessURL = new URL(url);
    hashlessURL.hash = '';
    return hashlessURL.toString();
}

async function hasDuplicates(tabId, tabUrl, tabWinId, tabGroupId) {
    const { effectTabGroups, effectWindows } = options;
    const queriedTabs = await chrome.tabs.query({ url: constructUrl(tabUrl) });
    return queriedTabs.reduce((acc, { url, id, windowId, groupId }) => {
        return (
            acc ||
            (url === tabUrl &&
                id !== tabId &&
                windowId === (effectWindows ? windowId : tabWinId) &&
                groupId === (effectTabGroups ? groupId : tabGroupId) &&
                !isExcluded(tabUrl))
        );
    }, false);
}

function isExcluded(tabUrl) {
    const { exclusions } = options;
    return exclusions.some(exclusion => {
        const regexedExclusion = new RegExp(exclusion);
        return regexedExclusion.test(tabUrl);
    });
}

async function getTabId(tabUrl, tabWinId, tabGroupId) {
    const queryParams = { url: constructUrl(tabUrl)};
    if (!effectWindowsOption) {
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
    { url: tabUrl, openerTabId, windowId: tabWinId, groupId: tabGroupId }
) {
    if (loading || status === 'unloaded') return;
    if (!moveTabsOption) setOptionsValues();
    const duplicateCheck = await hasDuplicates(
        tabId,
        tabUrl,
        tabWinId,
        tabGroupId
    );
    if (duplicateCheck) {
        closeChromeTab(tabId);
        const alreadyOpenedTabId = await getTabId(tabUrl, tabWinId, tabGroupId);
        changeChromeTabFocus(alreadyOpenedTabId);
        if (openerTabId && options.moveTabs) {
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
const getLocalStorageKey = key => {
    let storageKey = key;
    if (typeof storageKey !== 'array') storageKey = [storageKey];

    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(key, resolve)
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Set an object in local storage to the given value
 * Local Stoarge objects key is based on the Object key passed in
 * @param {Object} val 
 */
const setLocalStorageValue = val => chrome.storage.local.set(val);


chrome.storage.onChanged.addListener(getOptions);

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

chrome.tabs.onUpdated.addListener(onUpdate);
