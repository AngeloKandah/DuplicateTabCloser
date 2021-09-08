chrome.storage.local.get(['moveTabs', 'effectWindows', 'effectTabGroups', 'exclusionArray'], (data) => {
    document.getElementById('moveTabs').checked = data.moveTabs ?? true
    document.getElementById('effectWindows').checked = data.effectWindows ?? false
    document.getElementById('effectTabGroups').checked = data.effectTabGroups ?? false
    createHTMLList(data.exclusionArray ?? [])
})

const submit = document.getElementById('submit');
const exclusionBox = document.getElementById('exclusionArray')

function isPropertyEnabled(id) {
    return document.getElementById(id).checked
}

function createHTMLList(exclusionArray){
    let htmlList = ""
    exclusionArray.forEach(item => { //could do a reduce here?
        htmlList += `<li>${item}</li>`;
    })
    document.getElementById('exclusions').innerHTML = htmlList
}

function submitChanges() {
    const settingFields = [
        'moveTabs',
        'effectWindows',
        'effectTabGroups'
    ]
    const [moveTabs, effectWindows, effectTabGroups] = settingFields.map(isPropertyEnabled)
    chrome.storage.local.set({ moveTabs, effectWindows, effectTabGroups })
}

submit.addEventListener('click', () => {
    submitChanges();
})

exclusionBox.addEventListener('keyup', event => {
    if (event.code === 'Enter') {
        if(/\s/.test(exclusionBox.value) || !exclusionBox.value){
            return
        }
        chrome.storage.local.get({ exclusionArray: [] }, (data) => {
            exclusionArray = [...data.exclusionArray];
            exclusionArray.push(exclusionBox.value)
            chrome.storage.local.set({ exclusionArray })
            createHTMLList(exclusionArray)
        })
    }
})
