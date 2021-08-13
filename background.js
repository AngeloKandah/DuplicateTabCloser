let tab_list = {};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ tab_list });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.set({ tab_list });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.text != "what is my tab_info?") {
        return;
    }
    const { tab: { id, url } } = sender;
    sendResponse({id, url});
});

chrome.runtime.onMessage.addListener(({id: tabId}) => {
    chrome.tabs.remove(tabId)
})

chrome.tabs.onRemoved.addListener((tabId, info) => {
    chrome.tabs.get(tabId, function(tab) {
        if(tab_list[tab.url]){
            delete tab_list[tab.url]
        }
    })
})