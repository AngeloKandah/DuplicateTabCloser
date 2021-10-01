import { chrome } from 'jest-chrome'

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
    tabs.forEach(async ({ id, url, windowId, groupId }) => {
        const hasDupes = await hasDuplicates(id, url, windowId, groupId);
        tabsWithoutDups.includes(url) && hasDupes
            ? closeChromeTab(id)
            : tabsWithoutDups.push(url);
    });
}

function constructUrl(url) {
    const hashlessURL = new URL(url);
    hashlessURL.hash = '';
    return hashlessURL.toString();
}

const hasDuplicates = async (tabId, tabUrl, tabWinId, tabGroupId) => {
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
    if (effectWindows) {
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
const getLocalStorageKey = (key) => { //need to learn how to test
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
};
