import './styles.css';
import { updateOptions } from './chrome_storage.js';
import { getOptions } from './background.js';

//any jquery-ers in the chat?
const $ = id => document.getElementById(id);

getOptions().then(options => {
    const {
        moveTabs,
        effectWindows,
        effectTabGroups,
        exclusions,
        logMaxUrls,
        loggedUrls,
        closeGracePeriod,
    } = options;
    $('moveTabs').checked = moveTabs;
    $('effectWindows').checked = effectWindows;
    $('effectTabGroups').checked = effectTabGroups;
    $('logMaxUrls').value = logMaxUrls;
    $('closeGracePeriod').value = closeGracePeriod;

    createExclusionList(exclusions);
    createLogList(loggedUrls);
});

document.querySelectorAll('.optionList').forEach((item) => {
    item.addEventListener('click', submitChanges);
});

const exclusionBox = $('exclusionArray');
const exclusionList = $('exclusions');

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
    deleteButton.textContent = 'x';
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

function isChecked(id) {
    return $(id).checked;
}

async function submitChanges() {
    const settingFields = ['moveTabs', 'effectWindows', 'effectTabGroups'];
    const [moveTabs, effectWindows, effectTabGroups] = settingFields.map(isChecked);
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

const pages = [...$('pageContainer').children];

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

$('nextPage').addEventListener('click', nextPage);
$('previousPage').addEventListener('click', prevPage);

const numberOfUrlsToLog = $('logMaxUrls');
const loggedList = $('loggedUrls');

logMaxUrls.addEventListener('keyup', async ({ code }) => {
    const { value: newNumber } = numberOfUrlsToLog;
    if (code !== 'Enter' || /\s/.test(newNumber)) {
        return;
    }
    updateOptions({ logMaxUrls: newNumber });
});

const gracePeriodInput = $('closeGracePeriod');

gracePeriodInput.addEventListener('change', async (event) => {
    const { target: { value: closeGracePeriodRaw } } = event;
    const closeGracePeriod = parseInt(closeGracePeriodRaw, 10);
    console.log(`updating grace period to ${closeGracePeriod}`);
    updateOptions({ closeGracePeriod });
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
