let tabArray = [];
let exclusionArrayOption;
let moveTabsOption;
let effectWindowsOption;
let effectTabGroupsOption;

async function initExtension() {
    await setOptionsValues();
    tabArray = await createTabList();
}

async function createTabList() {
    const infoOfAllTabs = await chrome.tabs.query({});
    return removeAllDuplicates(infoOfAllTabs.map(({ id }) => id));
}

async function setOptionsValues() {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            ["moveTabs", "effectWindows", "effectTabGroups", "exclusionArray"],
            ({
                moveTabs = true,
                effectWindows = false,
                effectTabGroups = false,
                exclusionArray = [],
            }) => {
                moveTabsOption = moveTabs;
                effectWindowsOption = effectWindows;
                effectTabGroupsOption = effectTabGroups;
                exclusionArrayOption = exclusionArray;
                resolve({
                    moveTabsOption,
                    effectWindowsOption,
                    effectTabGroupsOption,
                    exclusionArrayOption,
                });
            }
        );
    });
}

//computed property and templatte literals

async function removeAllDuplicates(listOfAllTabs) {
    const tabs = await getTabListInfo(listOfAllTabs);
    const tabsWithoutDups = [];
    /* tabs.reduce((acc, { url, id }) => {
        acc[url] = id;
        return acc;
    }, {}); */
    tabs.filter(({ url, id }) => {
        return tabsWithoutDups.includes(url)
            ? closeChromeTab(id)
            : tabsWithoutDups.push(url);
    });
    return tabs.map(({ id }) => id);
}

function getTabListInfo(tabs = tabArray) {
    const promisifedTabInfo = tabs.map((id) => chrome.tabs.get(id)); //Converting every tabId into the tab's info as a promise
    return Promise.all(promisifedTabInfo);
}

async function hasDuplicates(tabId, tabUrl, tabWinId, tabGroupId) {
    const tabListInfo = await getTabListInfo();
    return tabListInfo.reduce((acc, { url, id, windowId, groupId }) => {
        return (
            acc ||
            (url === tabUrl &&
                id != tabId &&
                windowId === (effectWindowsOption ? windowId : tabWinId) &&
                groupId === (effectTabGroupsOption ? groupId : tabGroupId) &&
                !isExcluded(tabUrl))
        );
    }, false);
}

function isExcluded(tabUrl) {
    return exclusionArrayOption.reduce((acc, exclusion) => {
        return acc || tabUrl.includes(exclusion)
    }, false);
}

async function getTabId(tabUrl) {
    const tabListInfo = await getTabListInfo();
    const { id: tabId } = tabListInfo.find(({ url }) => url === tabUrl);
    return tabId;
}

function closeChromeTab(tabId) {
    chrome.tabs.remove(tabId);
}

function changeChromeTabFocus(tabId) {
    chrome.tabs.update(tabId, { active: true });
}

function moveChromeTab(tabPosition, tabId) {
    chrome.tabs.move(tabId, { index: tabPosition });
}

async function getTabPosition(tabId) {
    const { index: tabPosition } = await chrome.tabs.get(tabId);
    return tabPosition;
}

async function onUpdate(
    tabId,
    changeInfo,
    { url: tabUrl, openerTabId, windowId: tabWinId, groupId: tabGroupId }
) {
    if (changeInfo.url) return; //When url is done being loaded/changing we know it is final one.
    if (changeInfo.status === "unloaded") return;
    if (!tabArray.includes(tabId)) {
        tabArray.push(tabId);
    }
    const duplicateCheck = await hasDuplicates(
        tabId,
        tabUrl,
        tabWinId,
        tabGroupId
    );
    if (duplicateCheck) {
        const alreadyOpenedTabId = await getTabId(tabUrl);
        closeChromeTab(tabId);
        tabArray = tabArray.filter((id) => id !== tabId);
        changeChromeTabFocus(alreadyOpenedTabId);
        if (openerTabId && moveTabsOption) {
            const tabPosition = await getTabPosition(openerTabId);
            moveChromeTab(tabPosition, alreadyOpenedTabId);
        }
    }
}

chrome.storage.onChanged.addListener(setOptionsValues);

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabArray.includes(tabId)) {
        tabArray = tabArray.filter((id) => id !== tabId);
    }
});

chrome.tabs.onUpdated.addListener(onUpdate);
