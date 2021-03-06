import {
    getLocalStorageKey,
    setLocalStorageValue,
    updateOptions,
} from './chrome_storage.js';

function initExtension() {
    removeAllDuplicates();
}

export async function getOptions() {
    const { options } = await getLocalStorageKey('options');
    if (!options) {
        const defaultOptions = {
            moveTabs: true,
            effectWindows: false,
            effectTabGroups: false,
            exclusions: [],
            logMaxUrls: 5,
            loggedUrls: [],
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

export function constructUrl(url) {
    const hashlessURL = new URL(url);
    hashlessURL.hash = '';
    return hashlessURL.toString();
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
    if (duplicateCheck) {
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
}

chrome.storage.onChanged.addListener(getOptions);

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

chrome.tabs.onUpdated.addListener(onUpdate);
