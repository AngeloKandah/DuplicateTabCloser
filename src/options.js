import './styles.css';
import { getLocalStorageKey, setLocalStorageValue } from './chrome_storage.js';

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
    };
    setLocalStorageValue({ options: updatedOptions });
};

getLocalStorageKey('options').then(({ options }) => {
    const { moveTabs, effectWindows, effectTabGroups, exclusions } = options;
    document.getElementById('moveTabs').checked = moveTabs;
    document.getElementById('effectWindows').checked = effectWindows;
    document.getElementById('effectTabGroups').checked = effectTabGroups;
    createHTMLList(exclusions);
});

document.querySelectorAll('.optionList').forEach((item) => {
    item.addEventListener('click', submitChanges);
});

document.getElementById('nextPage').addEventListener('click', changePage);
document.getElementById('previousPage').addEventListener('click', changePage);

const exclusionBox = document.getElementById('exclusionArray');
const exclusionList = document.getElementById('exclusions');

const title = document.getElementById('headerTitle');
const settingsPage = document.getElementById('settingsPage');
const exclusionPage = document.getElementById('exclusionPage');

title.textContent = 'Settings';
settingsPage.className = 'optionPage active';

function createHTMLList(exclusions) {
    exclusions.forEach(addToHTMLList);
}

function addToHTMLList(item) {
    const listItem = document.createElement('li');
    listItem.textContent = `${item}`;
    exclusionList.appendChild(listItem);
    const deleteButton = createDeleteButton();
    listItem.appendChild(deleteButton);
    exclusionBox.value = '';
}

function createDeleteButton() {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'deleteBtn';
    deleteButton.addEventListener('click', async () => {
        const itemToRemove = deleteButton.parentElement;
        itemToRemove.remove();
        const {
            firstChild: { data: removedExclusion },
        } = itemToRemove;
        const {
            options: { exclusions },
        } = await getLocalStorageKey('options');
        const newExclusions = exclusions.filter(
            (item) => item !== removedExclusion
        );
        await updateOptions({ exclusions: newExclusions });
    });
    return deleteButton;
}

function isOptionEnabled(id) {
    return document.getElementById(id).checked;
}

async function submitChanges() {
    const settingFields = ['moveTabs', 'effectWindows', 'effectTabGroups'];
    const [moveTabs, effectWindows, effectTabGroups] =
        settingFields.map(isOptionEnabled);
    await updateOptions({ moveTabs, effectWindows, effectTabGroups });
}

exclusionBox.addEventListener('keyup', async ({ code }) => {
    const { value: newExclusion } = exclusionBox;
    if (code !== 'Enter' || !newExclusion || /\s/.test(newExclusion)) {
        return;
    }

    const {
        options: { exclusions },
    } = await getLocalStorageKey('options');
    if (exclusions.includes(newExclusion)) {
        exclusionBox.value = '';
        return;
    }

    const newExclusions = [...exclusions, newExclusion];
    await updateOptions({ exclusions: newExclusions });
    addToHTMLList(newExclusion);
});

function changePage() {
    if (settingsPage.className === 'optionPage active') {
        settingsPage.className = 'optionPage';
        exclusionPage.className = 'optionPage active';
        title.textContent = 'Exclusions';
    } else {
        settingsPage.className = 'optionPage active';
        exclusionPage.className = 'optionPage';
        title.textContent = 'Settings';
    }
}
