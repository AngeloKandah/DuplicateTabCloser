chrome.storage.local.get(['moveTabs', 'affectWindows', 'affectTabGroups'], (data) => {
    document.getElementById('moveTabs').checked = data.moveTabs ?? true
    document.getElementById('affectWindows').checked = data.affectWindows ?? false
    document.getElementById('affectTabGroups').checked = data.affectTabGroups ?? false
})

const submit = document.querySelector('#submit');

function submitChanges() {
    let moveTabs = document.getElementById('moveTabs').checked;
    chrome.storage.local.set({ moveTabs })
    let affectWindows = document.getElementById('affectWindows').checked;
    chrome.storage.local.set({ affectWindows })
    let affectTabGroups = document.getElementById('affectTabGroups').checked;
    chrome.storage.local.set({ affectTabGroups })
}

submit.addEventListener('click', () => {
    submitChanges();
})

//Treat all windows as one list option
//Tab groups option
//Move tabs from middle click