let tab_list = {};

function hasDuplicates(tab_id, tab_url) {
    for (let tab_list_id in tab_list) {
        if (tab_list_id != tab_id && tab_list[tab_list_id] === tab_url) {
            return true
        }
    }
    return false
}

function removeDuplicate(tab_id) {
    chrome.tabs.remove(tab_id, function ignore_error() {void chrome.runtime.lastError;})
}

function changeTab(tab_url){
    for (let tab_list_id in tab_list) {
        if(tab_url === tab_list[tab_list_id]){
            chrome.tabs.update(parseInt(tab_list_id), {active: true})
        }
    }
}

function moveTab(tab_url, openerTab){
    console.log(tab_url,openerTab)
    for (let tab_list_id in tab_list){
        if (tab_url === tab_list[tab_list_id]){
            console.log(chrome.tabs.get(openerTab, function(tab) {
                chrome.tabs.move(parseInt(tab_list_id), {index: tab.index+1})
            }))
        }
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(tabId, tab.url, changeInfo, tab.openerTabId);
    if (changeInfo.url) {
        return
    }
    if (!hasDuplicates(tabId, tab.url)) {
        tab_list[tabId] = tab.url;
        return
    }
    removeDuplicate(tabId)
    if(!tab.openerTabId){
        changeTab(tab.url)
        return
    }
    moveTab(tab.url, tab.openerTabId)
})

chrome.tabs.onRemoved.addListener((tabId) => {
    if(tab_list[tabId]){
        delete tab_list[tabId]
    }
})