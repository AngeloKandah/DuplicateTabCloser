let tabList = [];
let moveTabs;
let affectWindows;
let affectTabGroups;


async function initExtension() {
    await initOptions();
    //({moveTabs, affectWindows, affectTabGroups}) = await initOptions()
    tabList = await initTabList()
}

async function initTabList() {
    const infoOfAllTabs = await chrome.tabs.query({});
    return removeAllDuplicates(infoOfAllTabs.map(({ id }) => id));
}

async function initOptions() {
    chrome.storage.local.get(['moveTabs', 'affectWindows', 'affectTabGroups'], (data) => {
        moveTabs = data.moveTabs ?? true
        affectWindows = data.affectWindows ?? false
        affectTabGroups = data.affectTabGroups ?? false
    }) 
}

async function removeAllDuplicates(listOfAllTabs) {
    const tabs = await getTabListInfo(listOfAllTabs);
    const tabsWithoutDups = []
    tabs.filter(({ url, id }) => {
        return tabsWithoutDups.includes(url) ? removeTab(id) : tabsWithoutDups.push(url);
    })
    return tabs.map(({ id }) => id)
}

function getTabListInfo(tabs = tabList) {
    const promisifedTabInfo = tabs.map(id => chrome.tabs.get(id)); //Converting every tabId into the tab's info as a promise
    return Promise.all(promisifedTabInfo)
}

async function hasDuplicates(tabId, tabUrl, tabWinId) {
    const tabListInfo = await getTabListInfo()
    return tabListInfo.reduce((acc, { url, id, windowId }) => {
        return acc || (url === tabUrl && id != tabId && windowId === tabWinId)
    }, false)
}

async function getTabId(tabUrl) {
    const tabListInfo = await getTabListInfo()
    const { id: tabId } = tabListInfo.find(({ url }) => url === tabUrl)
    return tabId
}

function removeTab(tabId) {
    chrome.tabs.remove(tabId)
    tabList = tabList.filter(id => id !== tabId)
}

function changeTab(tabId) {
    chrome.tabs.update(tabId, { active: true })
}

function moveTab(tabPosition, tabId) {
    chrome.tabs.move(tabId, { index: tabPosition + 1 })
}

async function getTabPosition(tabId) {
    const { index: tabPosition } = await chrome.tabs.get(tabId)
    return tabPosition
}

async function onUpdate(tabId, changeInfo, { url: tabUrl, openerTabId, windowId: tabWinId }) {
    console.log(moveTabs)
    if (changeInfo.url) return
    if (!tabList.includes(tabId)) {
        tabList.push(tabId);
    }
    const duplicateCheck = await hasDuplicates(tabId, tabUrl, tabWinId)
    if (duplicateCheck) {
        const alreadyOpenedTabId = await getTabId(tabUrl);
        removeTab(tabId)
        changeTab(alreadyOpenedTabId)
        if (openerTabId && moveTabs) {
            const tabPosition = await getTabPosition(openerTabId)
            moveTab(tabPosition, alreadyOpenedTabId);
        }
    }
}

function updateOptions(changes) {
    chrome.storage.local.get(['moveTabs', 'affectWindows', 'affectTabGroups'], (data) => {
        moveTabs = data.moveTabs ?? true
        affectWindows = data.affectWindows ?? false
        affectTabGroups = data.affectTabGroups ?? false
    }) 
}

chrome.storage.onChanged.addListener(updateOptions)

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabList.includes(tabId)) {
        tabList = tabList.filter(id => id !== tabId)
    }
})

chrome.tabs.onUpdated.addListener(onUpdate)