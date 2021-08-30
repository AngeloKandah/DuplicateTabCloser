const tab_list = [];

chrome.runtime.onInstalled.addListener(initExtension);

chrome.runtime.onStartup.addListener(initExtension);

function initExtension() {
    initTabList();
}

async function initTabList(){
    const promisifiedTabList = chrome.tabs.query({});
    const infoOfAllTabs = await promisifiedTabList
    tab_list = infoOfAllTabs.map(({ id }) => id)
    return
}

function getTabListInfo() {
    const promisifedTabInfo = tab_list.map(id => chrome.tabs.get(id)); //Converting every tabId into the tab's info as a promise
    return Promise.all(promisifedTabInfo)
}

async function hasDuplicates(tab_id, tab_url) {
    const tabListInfo = await getTabListInfo()
    return tabListInfo.reduce((acc, { url, id }) => {
        return acc || (url === tab_url && id != tab_id)
    }, false)
}

async function getOpenedTabId(tabUrl) {
    const tabListInfo = await getTabListInfo()
    const { id: tabId } = tabListInfo.find(({ url }) => url === tabUrl)
    return tabId
}

function removeDuplicate(tab_id) {
    chrome.tabs.remove(tab_id)
    tab_list = tab_list.filter(id => id !== tab_id)
    return
}

function changeTab(tab_id) {
    chrome.tabs.update(tab_id, { active: true })
    return
}

/* function moveTab(tab_id, openerTab) {
    chrome.tabs.get(openerTab, function (tab) {
        chrome.tabs.move(tab_id, { index: tab.index + 1 })
    });
} */

async function onUpdate(tabId, changeInfo, { url: tabUrl, openerTabId }) {
    if (changeInfo.url) {
        return
    }
    if (!tab_list.includes(tabId)) {
        tab_list.push(tabId);
    }
    const duplicateCheck = await hasDuplicates(tabId, tabUrl)
    if (duplicateCheck) {
        removeDuplicate(tabId)
        const alreadyOpenedTabId = await getOpenedTabId(tabUrl)
        changeTab(alreadyOpenedTabId)
    }
}

chrome.tabs.onRemoved.addListener((tabId) => {
    tab_list.splice(1, tabId)
})

chrome.tabs.onUpdated.addListener(onUpdate)