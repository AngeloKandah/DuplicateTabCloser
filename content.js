chrome.storage.local.get("tab_list", (data) => {
    tab_list = data.tab_list;
})

function removeDuplicates(id, url){
    for(let tab_list_url in tab_list){
        if(tab_list_url === url && tab_list[tab_list_url] != id){
            chrome.runtime.sendMessage({ id })
        }
    }
}

chrome.runtime.sendMessage({ text: "what is my tab_info?" }, ( {id, url} ) => {
    removeDuplicates(id, url);
    tab_list[url] = id;
    chrome.storage.local.set({ tab_list })
    console.log(tab_list)
});