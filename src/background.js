import {
    getLocalStorageKey,
    setLocalStorageValue,
    updateOptions,
} from './chrome_storage.js';

let recentlyClosedTabs = [];

const defaultOptions = {
    moveTabs: true,
    effectWindows: false,
    effectTabGroups: false,
    exclusions: [],
    logMaxUrls: 5,
    loggedUrls: [],
    closeGracePeriod: 5, // in seconds
};

function initExtension() {
    removeAllDuplicates();
}

// https://stackoverflow.com/questions/14368596/how-can-i-check-that-two-objects-have-the-same-set-of-property-names
function objectsHaveSameKeys(...objects) {
    const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
    const union = new Set(allKeys);
    return objects.every(object => union.size === Object.keys(object).length);
}

export async function getOptions() {
    const { options } = await getLocalStorageKey('options');
    if (!options) {
        setLocalStorageValue({ options: defaultOptions });
        return defaultOptions;
    }
    if (!objectsHaveSameKeys(options, defaultOptions)) {
        //graceful addition of new options
        const updatedOptions = {
            ...defaultOptions,
            ...options,
        };
        setLocalStorageValue({ options: updatedOptions });
        return updatedOptions;
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

export function constructUrl(url) {
    const hashlessURL = new URL(url);
    hashlessURL.hash = '';
    return hashlessURL.toString();
}

export const cleanupRecentlyClosedTabs = () => {
    recentlyClosedTabs = recentlyClosedTabs.filter(({ expiresOn }) => Date.now() <= expiresOn);
}

// https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
function uniqByKeepLast(a, key) {
    return [
        ...new Map(
            a.map(x => [key(x), x])
        ).values()
    ]
}

export const addRecentlyClosedTab = async fingerprint => {
    const { closeGracePeriod } = await getOptions();
    const expiresOn = Date.now() + closeGracePeriod * 1000; //defined in seconds
    recentlyClosedTabs.push({
        fingerprint,
        expiresOn,
    });
    recentlyClosedTabs = uniqByKeepLast(recentlyClosedTabs, t => t.fingerprint)
    cleanupRecentlyClosedTabs();
}

export const isRecentlyClosedTab = async fingerprint => {
    cleanupRecentlyClosedTabs();
    return recentlyClosedTabs.find(({ fingerprint: f1 }) => f1 === fingerprint);
}

export const hasDuplicates = async (tabInfo) => {
    const {
        id: tabId,
        url: tabUrl,
        windowId: tabWinId,
        groupId: tabGroupId,
    } = tabInfo;
    const { effectTabGroups, effectWindows } = await getOptions();
    const queriedTabs = await chrome.tabs.query({ url: constructUrl(tabUrl) });
    const excluded = await isExcluded(tabUrl);
    const isRecentlyClosed = await isRecentlyClosedTab(await getTabFingerprint(tabId));
    if (excluded || isRecentlyClosed) return false;

    return queriedTabs.reduce((acc, { url, id, windowId, groupId }) => {
        return (
            acc ||
            (url === tabUrl &&
                id !== tabId &&
                windowId === (effectWindows ? windowId : tabWinId) &&
                groupId === (effectTabGroups ? groupId : tabGroupId))
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

async function closeChromeTab(tabId) {
    const fingerprint = await getTabFingerprint(tabId);
    addRecentlyClosedTab(fingerprint);
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

export async function getTabPosition(tabId) {
    const { index: tabPosition } = await chrome.tabs.get(tabId);
    return tabPosition;
}

async function addToUrlLog(url) {
    const { logMaxUrls, loggedUrls: oldUrls } = await getOptions();
    const loggedUrls = [url, ...oldUrls.slice(0, logMaxUrls - 1)];
    updateOptions({ loggedUrls });
}

async function onUpdate(
    tabId,
    { url: loading, status },
    { url, openerTabId, windowId, groupId }
) {

    if (loading || status === 'unloaded') return;

    const tabInfo = { id: tabId, url, windowId, groupId };
    const duplicateCheck = await hasDuplicates(tabInfo);

    if (!duplicateCheck) return;

    closeChromeTab(tabId);
    addToUrlLog(url);
    const alreadyOpenedTabId = await getTabId(url, windowId, groupId);
    changeChromeTabFocus(alreadyOpenedTabId);
    const { moveTabs } = await getOptions();
    if (openerTabId && moveTabs) {
        const tabPosition = await getTabPosition(openerTabId);
        await moveChromeTab(tabPosition, alreadyOpenedTabId);
    }
}

async function getTabFingerprint(tabID) {
    const { url } = await chrome.tabs.get(tabID);
    return url;
}

chrome.storage.onChanged.addListener(getOptions);

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

chrome.tabs.onUpdated.addListener(onUpdate);
