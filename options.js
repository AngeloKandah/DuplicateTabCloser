
/**
 * Read from local storage in async instead of using callbacks
 * Pass in a single string key or an array of keys to retrieve multiple values
 * 
 * @param {string|array<string>} key 
 * @returns {object}
 */
const getLocalStorageKey = key => {
    let storageKey = key;
    if (typeof storageKey !== 'array') storageKey = [storageKey];

    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(key, resolve)
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Set an object in local storage to the given value
 * Local Stoarge objects key is based on the Object key passed in
 * @param {Object} val 
 */
const setLocalStorageValue = val => chrome.storage.local.set(val);

/**
 * Upsert into options local storage namespace
 * Local Stoarge objects key is based on the Object key passed in
 * @param {Object} val 
 */
const updateOptions = async (updatedValues) => {
    const { options } = await getLocalStorageKey('options');
    const updatedOptions = {
        ...options,
        ...updatedValues,
    }
    setLocalStorageValue({ options: updatedOptions });
}

getLocalStorageKey('options')
    .then(({ options }) => {
        const { moveTabs, effectWindows, effectTabGroups, exclusions } = options;
        document.getElementById("moveTabs").checked = moveTabs;
        document.getElementById("effectWindows").checked = effectWindows;
        document.getElementById("effectTabGroups").checked = effectTabGroups;
        createHTMLList(exclusions);
    });


const submit = document.getElementById("submit");
const exclusionBox = document.getElementById("exclusionArray");
const exclusionList = document.getElementById("exclusions");

function isOptionEnabled(id) {
    return document.getElementById(id).checked;
}

function createHTMLList(exclusions) {
    exclusions.forEach(addToHTMLList);
}

function addToHTMLList(item) {
    const listItem = document.createElement("li");
    listItem.textContent = `${item}`;
    exclusionList.appendChild(listItem);
    const deleteButton = createDeleteButton();
    listItem.appendChild(deleteButton);
    exclusionBox.value = "";
}

function createDeleteButton() {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "DeleteBtn";
    deleteButton.addEventListener("click", async () => {
        const itemToRemove = deleteButton.parentElement;
        itemToRemove.remove();
        const { firstChild: { data: removedExclusion } } = itemToRemove;
        const { options: { exclusions } } = getLocalStorageKey('options');
        const newExclusions = exclusions.filter(item => item !== removedExclusion);
        await updateOptions({ exclusions: newExclusions });
    });
    return deleteButton;
}

async function submitChanges() {
    const settingFields = ["moveTabs", "effectWindows", "effectTabGroups"];
    const [moveTabs, effectWindows, effectTabGroups] = settingFields.map(isOptionEnabled);
    await updateOptions({ moveTabs, effectWindows, effectTabGroups });
}

submit.addEventListener("click", submitChanges);

exclusionBox.addEventListener("keyup", async ({ code }) => {
    const { value: newExclusion } = exclusionBox;
    if (
        code !== 'Enter'
        || !newExclusion
        || /\s/.test(newExclusion)
    ) {
        return;
    }

    const { options: { exclusions } } = await getLocalStorageKey('options');
    if (exclusions.includes(newExclusion)) {
        exclusionBox.value = "";
        return;
    }

    const newExclusions = [...exclusions, newExclusion];
    await updateOptions({ exclusions: newExclusions });
    addToHTMLList(newExclusion);
});