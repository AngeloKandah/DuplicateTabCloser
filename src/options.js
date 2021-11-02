import './styles.css';
import { getLocalStorageKey, updateOptions } from './chrome_storage.js';

getLocalStorageKey('options').then(({ options }) => {
    const {
        moveTabs,
        effectWindows,
        effectTabGroups,
        exclusions,
        logMaxUrls,
        loggedUrls,
    } = options;
    document.getElementById('moveTabs').checked = moveTabs;
    document.getElementById('effectWindows').checked = effectWindows;
    document.getElementById('effectTabGroups').checked = effectTabGroups;
    document.getElementById('logMaxUrls').value = logMaxUrls;
    createExclusionList(exclusions);
    createLogList(loggedUrls);
});

document.querySelectorAll('.optionList').forEach((item) => {
    item.addEventListener('click', submitChanges);
});

const exclusionBox = document.getElementById('exclusionArray');
const exclusionList = document.getElementById('exclusions');

function createExclusionList(exclusions) {
    exclusions.forEach(addToExclusionList);
}

function addToExclusionList(item) {
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
    addToExclusionList(newExclusion);
});

const pages = [...document.getElementById('pageContainer').children];

function setPage(goingForward) {
    const currentPageIndex = pages.findIndex((page) =>
        page.classList.contains('active')
    );
    const len = pages.length;
    const nextPageIndex = goingForward
        ? (currentPageIndex + 1) % len
        : (currentPageIndex + len - 1) % len;
    pages[currentPageIndex].classList.remove('active');
    pages[nextPageIndex].classList.add('active');
}

const nextPage = () => setPage(true);
const prevPage = () => setPage(false);

document.getElementById('nextPage').addEventListener('click', nextPage);
document.getElementById('previousPage').addEventListener('click', prevPage);

const numberOfUrlsToLog = document.getElementById('logMaxUrls');
const loggedList = document.getElementById('loggedUrls');

logMaxUrls.addEventListener('keyup', async ({ code }) => {
    const { value: newNumber } = numberOfUrlsToLog;
    if (code !== 'Enter' || /\s/.test(newNumber)) {
        return;
    }
    await updateOptions({ logMaxUrls: newNumber });
});

function createLogList(urls) {
    urls.forEach(addToLogList);
}

function addToLogList(item) {
    const listItem = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = `${item}`;
    anchor.target = `_blank`;
    anchor.innerText = `${item}`;
    listItem.appendChild(anchor);
    loggedList.appendChild(listItem);
}
