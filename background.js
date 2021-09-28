let exclusionArrayOption = [];
let moveTabsOption;
let effectWindowsOption;
let effectTabGroupsOption;

async function initExtension() {
    await setOptionsValues();
    removeAllDuplicates();
}

async function setOptionsValues() {
    await chrome.storage.local.get(
        ['options', 'exclusionArray'],
        ({
            options = {
                moveTabs: true,
                effectWindows: false,
                effectTabGroups: false,
            },
            exclusionArray = [],
        }) => {
            const { moveTabs, effectWindows, effectTabGroups } = options;
            moveTabsOption = moveTabs;
            effectWindowsOption = effectWindows;
            effectTabGroupsOption = effectTabGroups;
            exclusionArrayOption = exclusionArray;
        }
    );
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
    const urlFromChrome = new URL(url);
    const urlWithoutHash = new URL(
        `${urlFromChrome.origin}${urlFromChrome.pathname}${urlFromChrome.search}`
    );
    return urlWithoutHash.toString();
}

async function hasDuplicates(tabId, tabUrl, tabWinId, tabGroupId) {
    const queriedTabs = await chrome.tabs.query({ url: constructUrl(tabUrl) });
    return queriedTabs.reduce((acc, { url, id, windowId, groupId }) => {
        return (
            acc ||
            (url === tabUrl &&
                id !== tabId &&
                windowId === (effectWindowsOption ? windowId : tabWinId) &&
                groupId === (effectTabGroupsOption ? groupId : tabGroupId) &&
                !isExcluded(tabUrl))
        );
    }, false);
}

function isExcluded(tabUrl) {
    return exclusionArrayOption.some((exclusion) => {
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
        if (openerTabId && moveTabsOption) {
            const tabPosition = await getTabPosition(openerTabId);
            await moveChromeTab(tabPosition, alreadyOpenedTabId);
        }
    }
}

chrome.storage.onChanged.addListener(setOptionsValues);

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

chrome.tabs.onUpdated.addListener(onUpdate);
