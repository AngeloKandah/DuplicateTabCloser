let tab_list = [];

/* chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, function(tabs) {
        tab_list[tabs.id] = tabs.url;
    })
    console.log(tab_list)
});

chrome.runtime.onStartup.addListener(() => {

}); */

function hasDuplicates(tab_id, tab_url) {
    for (let i = 0; i < tab_list.length; i++) {
        chrome.tabs.get(tab_list[i], function(tab){
            if (tab.url === tab_url && tab.id != tab_id) {
                return true;
            }
            return false;
        });
    }
}

function removeDuplicate(tab_id) {
    chrome.tabs.remove(tab_id, function ignore_error() {void chrome.runtime.lastError;})
}

function changeTab(tab_url){
    let tab_id = getId(tab_url)
    if (tab_id){
        chrome.tabs.update(tab_id, {active: true})
    }
}

function moveTab(tab_url, openerTab){
    let tab_id = getId(tab_url)
    chrome.tabs.get(openerTab, function(tab) {
        chrome.tabs.move(tab_id, {index: tab.index+1})
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    //console.log(tabId, tab_list, tab.url)
    if (changeInfo.url) {
        return
    }
    console.log(tab_list)
    if (!hasDuplicates(tabId, tab.url)) {
        if(!tab_list.includes(tabId)){
            tab_list.push(tabId);
        }
        return
    }
    console.log(tab_list)
    removeDuplicate(tabId)
    if(!tab.openerTabId){
        changeTab(tab.url)
        return
    }
    moveTab(tab.url, tab.openerTabId)
})

chrome.tabs.onRemoved.addListener((tabId) => {
    tab_list.splice(1, tabId)
})