let tab_list = {};

function hasDuplicates(tab_id, tab_url) {
    for (let tab_list_id in tab_list) {
        console.log(tab_list_id, tab_id, tab_list[tab_list_id], tab_url)
        if (tab_list_id != tab_id && tab_list[tab_list_id] === tab_url) {
            return true
        }
    }
    return false
}

function removeDuplicate(tab_id) {
    chrome.tabs.remove(tab_id)
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(tabId, tab.url, changeInfo);
    if (changeInfo.url) {
        return
    }
    if (!hasDuplicates(tabId, tab.url)) {
        tab_list[tabId] = tab.url;
        return
    }
    removeDuplicate(tabId)
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    delete tab_list[tabId]
})