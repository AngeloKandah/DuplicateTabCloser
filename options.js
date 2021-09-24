chrome.storage.local.get(
    ["options", "exclusionArray"],
    ({
        options = {
            moveTabs: true,
            effectWindows: false,
            effectTabGroups: false,
        },
        exclusionArray = [],
    }) => {
        const { moveTabs, effectWindows, effectTabGroups } = options;
        document.getElementById("moveTabs").checked = moveTabs;
        document.getElementById("effectWindows").checked = effectWindows;
        document.getElementById("effectTabGroups").checked = effectTabGroups;
        createHTMLList(exclusionArray);
        chrome.storage.local.set({
            options: {
                moveTabs,
                effectWindows,
                effectTabGroups,
            },
            exclusionArray,
        });
    }
);

const submit = document.getElementById("submit");
const exclusionBox = document.getElementById("exclusionArray");
const exclusionList = document.getElementById("exclusions");

function isPropertyEnabled(id) {
    return document.getElementById(id).checked;
}

function createHTMLList(exclusionArray) {
    exclusionArray.forEach((item) => {
        addToHTMLList(item);

    });
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
    deleteButton.addEventListener("click", () => {
        const itemToRemove = deleteButton.parentElement;
        itemToRemove.remove();
        chrome.storage.local.get(
            { exclusionArray: [] },
            ({ exclusionArray: oldExclusionArray }) => {
                const exclusionArray = oldExclusionArray.filter(
                    (item) => item !== itemToRemove.firstChild.data
                );
                chrome.storage.local.set({ exclusionArray });
            }
        );
    });
    return deleteButton;
}

function submitChanges() {
    const settingFields = ["moveTabs", "effectWindows", "effectTabGroups"];
    const [moveTabs, effectWindows, effectTabGroups] =
        settingFields.map(isPropertyEnabled);
    chrome.storage.local.set({
        options: { moveTabs, effectWindows, effectTabGroups },
    });
}

submit.addEventListener("click", () => {
    submitChanges();
});

exclusionBox.addEventListener("keyup", (event) => {
    if (event.code === "Enter") {
        if (/\s/.test(exclusionBox.value) || !exclusionBox.value) {
            return;
        }
        chrome.storage.local.get(
            { exclusionArray: [] },
            ({ exclusionArray: oldExclusionArray }) => {
                if (oldExclusionArray.includes(exclusionBox.value)) {
                    exclusionBox.value = "";
                    return;
                }
                const exclusionArray = [
                    ...oldExclusionArray,
                    exclusionBox.value,
                ];
                chrome.storage.local.set({ exclusionArray });
                addToHTMLList(exclusionBox.value);
            }
        );
    }
});
